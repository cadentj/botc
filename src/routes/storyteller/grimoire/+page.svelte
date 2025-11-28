<script lang="ts">
	import { SvelteFlow, Background, BackgroundVariant, type Node, type Edge } from '@xyflow/svelte';
	import '@xyflow/svelte/dist/style.css';
	import CharacterTokenNode, { type TokenData } from '$lib/components/character-token-node.svelte';
	import { CHARACTERS_BY_TYPE } from '$lib/botc-data/trouble-brewing.svelte';
	import { getSelectedCharacters } from '$lib/stores/lobby.svelte';
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

	// Get lobby code from URL params
	const lobbyCode = $derived($page.url.searchParams.get('code') || '');

	// Dead state tracking
	let deadStates = $state<Record<string, boolean>>({});
	let characterToPlayer = $state<Record<string, string>>({});
	let pollInterval: ReturnType<typeof setInterval> | null = null;
	let pollStartTime = $state<number | null>(null);
	const POLL_DURATION = 5 * 60 * 1000; // 5 minutes
	const POLL_INTERVAL = 10 * 1000; // 10 seconds

	function toggleDead(id: string) {
		deadStates[id] = !deadStates[id];
		// Update the node data
		nodes = nodes.map((node) =>
			node.id === id
				? {
						...node,
						data: {
							...node.data,
							isDead: deadStates[id],
						},
					}
				: node
		);
	}

	function stopPolling() {
		if (pollInterval) {
			clearInterval(pollInterval);
			pollInterval = null;
		}
	}

	async function pollLobby() {
		if (!lobbyCode) return;

		try {
			const response = await fetch(`/api/lobby/${lobbyCode}`);
			if (!response.ok) {
				console.error('Failed to fetch lobby');
				return;
			}

			const data = await response.json();
			characterToPlayer = data.characterToPlayer || {};

			// Update nodes with player names
			nodes = nodes.map((node) => {
				const characterName = node.data.character.name;
				const playerName = characterToPlayer[characterName] || undefined;
				return {
					...node,
					data: {
						...node.data,
						playerName,
					} satisfies TokenData,
				};
			});

			// Stop polling if all characters have been assigned
			const allAssigned = Object.values(characterToPlayer).every((player) => player);
			if (allAssigned && Object.keys(characterToPlayer).length > 0) {
				stopPolling();
			}
		} catch (error) {
			console.error('Error polling lobby:', error);
		}
	}

	// Create nodes in circle layout
	function createInitialNodes(): Node[] {
		const centerX = 300;
		const centerY = 300;
		const radius = 250;

		const characters: Character[] = [];
		const selectedChars = getSelectedCharacters();
		for (const characterName of selectedChars) {
			const character = findCharacterByName(characterName);
			if (character) {
				characters.push(character);
			}
		}

		return characters.map((character, i) => {
			const angle = (2 * Math.PI * i) / characters.length - Math.PI / 2;
			const id = `token-${i}`;
			const playerName = characterToPlayer[character.name] || undefined;
			return {
				id,
				type: 'characterToken',
				position: {
					x: centerX + radius * Math.cos(angle),
					y: centerY + radius * Math.sin(angle),
				},
				data: {
					character,
					isDead: false,
					onToggleDead: () => toggleDead(id),
					playerName,
				} satisfies TokenData,
			};
		});
	}

	const nodeTypes = {
		characterToken: CharacterTokenNode,
	};

	let nodes = $state<Node[]>([]);
	let edges = $state<Edge[]>([]);

	onMount(() => {
		// Initialize nodes from selected characters
		nodes = createInitialNodes();
		
		// Start polling
		pollStartTime = Date.now();
		pollLobby(); // Poll immediately
		pollInterval = setInterval(() => {
			const elapsed = Date.now() - (pollStartTime || 0);
			if (elapsed >= POLL_DURATION) {
				stopPolling();
				return;
			}
			pollLobby();
		}, POLL_INTERVAL);
	});

	onDestroy(() => {
		stopPolling();
	});
</script>

<svelte:head>
	<title>Grimoire</title>
</svelte:head>

<div class="h-screen w-screen relative">
	{#if lobbyCode}
		<div class="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-base-100 p-4 rounded-lg shadow-lg">
			<div class="text-center">
				<p class="text-sm text-base-content/70">Lobby Code</p>
				<p class="text-3xl font-bold tracking-wider">{lobbyCode}</p>
			</div>
		</div>
	{/if}
	<SvelteFlow bind:nodes bind:edges {nodeTypes} fitView fitViewOptions={{ padding: 0.3 }}>
		<Background variant={BackgroundVariant.Dots} gap={20} />
	</SvelteFlow>
</div>

<style>
	:global(.svelte-flow) {
		--xy-background-color: transparent;
	}
</style>
