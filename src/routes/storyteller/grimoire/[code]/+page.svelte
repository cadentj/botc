<script lang="ts">
	import { SvelteFlow, Background, BackgroundVariant, type Node, type Edge } from '@xyflow/svelte';
	import '@xyflow/svelte/dist/style.css';
	import CharacterTokenNode, { type TokenData } from '$lib/components/character-token-node.svelte';
	import { CHARACTERS_BY_TYPE } from '$lib/botc-data/trouble-brewing.svelte';
	import { page } from '$app/stores';
	import { onMount, onDestroy } from 'svelte';
	import type { Character } from '$lib/types/characters';

	function findCharacterByName(name: string): Character | null {
		for (const characters of Object.values(CHARACTERS_BY_TYPE)) {
			const character = characters.find(c => c.name === name);
			if (character) return character;
		}
		return null;
	}

	// Get lobby code from route params
	const lobbyCode = $derived($page.params.code);

	// Dead state tracking
	let deadStates = $state<Record<string, boolean>>({});
	let characterToPlayer = $state<Record<string, string>>({});
	let pollInterval: ReturnType<typeof setInterval> | null = null;
	let countdownInterval: ReturnType<typeof setInterval> | null = null;
	let pollStartTime = $state<number | null>(null);
	let remainingSeconds = $state(5 * 60);
	let isPolling = $state(true);
	const POLL_DURATION = 5 * 60 * 1000; // 5 minutes
	const POLL_INTERVAL = 10 * 1000; // 10 seconds

	const formattedCountdown = $derived(() => {
		const mins = Math.floor(remainingSeconds / 60);
		const secs = remainingSeconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	});

	function toggleDead(id: string) {
		deadStates[id] = !deadStates[id];
		// Update the node data
		nodes = nodes.map((node) => {
			if (node.id !== id) return node;
			const data = node.data as TokenData;
			return {
				...node,
				data: {
					...data,
					isDead: deadStates[id],
				} satisfies TokenData,
			};
		});
	}

	function stopPolling() {
		if (pollInterval) {
			clearInterval(pollInterval);
			pollInterval = null;
		}
		if (countdownInterval) {
			clearInterval(countdownInterval);
			countdownInterval = null;
		}
		isPolling = false;
	}

	// Create nodes in circle layout from characterToPlayer mapping
	function createNodesFromCharacters(charToPlayer: Record<string, string>): Node[] {
		const centerX = 300;
		const centerY = 300;
		const radius = 250;

		const characters: Character[] = [];
		for (const characterName of Object.keys(charToPlayer)) {
			const character = findCharacterByName(characterName);
			if (character) {
				characters.push(character);
			}
		}

		return characters.map((character, i) => {
			const angle = (2 * Math.PI * i) / characters.length - Math.PI / 2;
			const id = `token-${i}`;
			const playerName = charToPlayer[character.name] || undefined;
			return {
				id,
				type: 'characterToken',
				position: {
					x: centerX + radius * Math.cos(angle),
					y: centerY + radius * Math.sin(angle),
				},
				data: {
					character,
					isDead: deadStates[id] || false,
					onToggleDead: () => toggleDead(id),
					playerName,
				} satisfies TokenData,
			};
		});
	}

	async function pollLobby() {
		try {
			const response = await fetch(`/api/lobby/${lobbyCode}`);
			if (!response.ok) {
				console.error('Failed to fetch lobby');
				return;
			}

			const data = await response.json();
			const newCharToPlayer = data.characterToPlayer || {};
			
			// If this is the first poll (no nodes yet), create the initial layout
			if (nodes.length === 0) {
				characterToPlayer = newCharToPlayer;
				nodes = createNodesFromCharacters(newCharToPlayer);
			} else {
				// Update existing nodes with player names
				characterToPlayer = newCharToPlayer;
				nodes = nodes.map((node) => {
					const data = node.data as TokenData;
					const playerName = newCharToPlayer[data.character.name] || undefined;
					return {
						...node,
						data: {
							...data,
							playerName,
						} satisfies TokenData,
					};
				});
			}

			// Stop polling if all characters have been assigned
			const allAssigned = Object.values(newCharToPlayer).every((player) => player);
			if (allAssigned && Object.keys(newCharToPlayer).length > 0) {
				stopPolling();
			}
		} catch (error) {
			console.error('Error polling lobby:', error);
		}
	}

	const nodeTypes = {
		characterToken: CharacterTokenNode,
	};

	let nodes = $state<Node[]>([]);
	let edges = $state<Edge[]>([]);

	onMount(() => {
		// Start polling - first poll will create the nodes
		pollStartTime = Date.now();
		pollLobby();
		pollInterval = setInterval(() => {
			const elapsed = Date.now() - (pollStartTime || 0);
			if (elapsed >= POLL_DURATION) {
				stopPolling();
				return;
			}
			pollLobby();
		}, POLL_INTERVAL);

		// Start countdown timer
		countdownInterval = setInterval(() => {
			const elapsed = Date.now() - (pollStartTime || 0);
			remainingSeconds = Math.max(0, Math.ceil((POLL_DURATION - elapsed) / 1000));
			if (remainingSeconds <= 0) {
				stopPolling();
			}
		}, 1000);
	});

	onDestroy(() => {
		stopPolling();
	});
</script>

<svelte:head>
	<title>Grimoire</title>
</svelte:head>

<div class="h-screen w-screen relative">
	<div class="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-base-100 p-4 rounded-lg shadow-lg">
		<div class="text-center">
			<p class="text-sm text-base-content/70">Lobby Code</p>
			<p class="text-3xl font-bold tracking-wider">{lobbyCode}</p>
			{#if isPolling}
				<p class="text-xs text-base-content/50 mt-1">Syncing for {formattedCountdown()}</p>
			{:else}
				<p class="text-xs text-base-content/50 mt-1">Sync complete</p>
			{/if}
		</div>
	</div>
	<SvelteFlow bind:nodes bind:edges {nodeTypes} fitView fitViewOptions={{ padding: 0.3 }}>
		<Background variant={BackgroundVariant.Dots} gap={20} />
	</SvelteFlow>
</div>

<style>
	:global(.svelte-flow) {
		--xy-background-color: transparent;
	}
</style>

