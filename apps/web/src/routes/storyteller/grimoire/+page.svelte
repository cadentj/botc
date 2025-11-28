<script lang="ts">
	import { SvelteFlow, Background, BackgroundVariant, type Node, type Edge } from '@xyflow/svelte';
	import '@xyflow/svelte/dist/style.css';
	import CharacterTokenNode, { type TokenData } from '$lib/components/character-token-node.svelte';
	import { TOWNSFOLK, OUTSIDERS, MINIONS, DEMONS } from '$lib/botc-data/trouble-brewing';
	import type { Character } from '$lib/types/characters';

	// Sample characters for demo
	const sampleCharacters: Character[] = [
		TOWNSFOLK[0], // Washerwoman
		TOWNSFOLK[1], // Librarian
		TOWNSFOLK[3], // Chef
		TOWNSFOLK[4], // Empath
		TOWNSFOLK[5], // Fortune Teller
		OUTSIDERS[0], // Butler
		OUTSIDERS[1], // Drunk
		MINIONS[0], // Poisoner
		MINIONS[1], // Spy
		DEMONS[0], // Imp
	];

	// Dead state tracking
	let deadStates = $state<Record<string, boolean>>({});

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

	// Create nodes in circle layout
	function createInitialNodes(): Node[] {
		const centerX = 300;
		const centerY = 300;
		const radius = 250;

		return sampleCharacters.map((character, i) => {
			const angle = (2 * Math.PI * i) / sampleCharacters.length - Math.PI / 2;
			const id = `token-${i}`;
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
				} satisfies TokenData,
			};
		});
	}

	const nodeTypes = {
		characterToken: CharacterTokenNode,
	};

	let nodes = $state.raw<Node[]>(createInitialNodes());
	let edges = $state.raw<Edge[]>([]);
</script>

<svelte:head>
	<title>Grimoire</title>
</svelte:head>

<div class="h-screen w-screen">
	<SvelteFlow bind:nodes bind:edges {nodeTypes} fitView fitViewOptions={{ padding: 0.3 }}>
		<Background variant={BackgroundVariant.Dots} gap={20} />
	</SvelteFlow>
</div>

<style>
	:global(.svelte-flow) {
		--xy-background-color: transparent;
	}
</style>
