<script lang="ts">
	import { page } from '$app/stores';
	import Grimoire from '$lib/components/grimoire.svelte';
	import NightOrderSheet from '$lib/components/night-order-sheet.svelte';
	import { CHARACTERS_BY_TYPE } from '$lib/botc-data/trouble-brewing.svelte';
	import type { Character } from '$lib/types/characters';
	import { Share, Check } from '@lucide/svelte';

	function findCharacterByName(name: string): Character | null {
		for (const characters of Object.values(CHARACTERS_BY_TYPE)) {
			const character = characters.find((c) => c.name === name);
			if (character) return character;
		}
		return null;
	}

	// Get lobby code from route params
	const lobbyCode = $derived($page.params.code);

	// Character to player mapping (will be updated by Grimoire component)
	let characterToPlayer = $state<Record<string, string>>({});

	// Share/copy state
	let copied = $state(false);

	// Derive characters list from characterToPlayer for NightOrderSheet
	const characters = $derived(() => {
		const chars: Character[] = [];
		for (const characterName of Object.keys(characterToPlayer)) {
			const character = findCharacterByName(characterName);
			if (character) {
				chars.push(character);
			}
		}
		return chars;
	});

	async function handleShare() {
		const joinUrl = `${window.location.origin}/?code=${lobbyCode}`;
		const shareData = {
			title: 'Join Blood on the Clocktower',
			text: `Join my game with code: ${lobbyCode}`,
			url: joinUrl,
		};

		// Try native share API first (mobile devices)
		if (navigator.share && navigator.canShare?.(shareData)) {
			try {
				await navigator.share(shareData);
				return;
			} catch (err) {
				// User cancelled or share failed, fall back to clipboard
				if ((err as Error).name === 'AbortError') return;
			}
		}

		// Fall back to clipboard copy
		try {
			await navigator.clipboard.writeText(joinUrl);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	}
</script>

<svelte:head>
	<title>Grimoire</title>
</svelte:head>

<div class="h-screen flex flex-col overflow-hidden">
	<!-- Header -->
	<header class="flex justify-between items-center px-6 py-3 bg-base-100 border-b border-base-300 shrink-0">
		<div class="flex items-center gap-3">
			<span class="text-sm text-base-content/70">Game Code:</span>
			<span class="font-mono text-sm text-base-content/70">
				{lobbyCode}
			</span>
			<button
				class="btn btn-ghost btn-xs btn-square"
				onclick={handleShare}
				title={copied ? 'Copied!' : 'Share join link'}
			>
				{#if copied}
					<Check size={14} class="text-success" />
				{:else}
					<Share size={14} />
				{/if}
			</button>
		</div>
	</header>

	<!-- Main content -->
	<div class="flex-1 flex overflow-hidden">
		<!-- Left 2/3: Grimoire -->
		<div class="w-2/3 h-full overflow-hidden">
			<Grimoire bind:characterToPlayer {lobbyCode} />
		</div>

		<!-- Right 1/3: Night Order -->
		<div class="w-1/3 h-full border-l border-base-300 overflow-y-auto">
			<NightOrderSheet characters={characters()} />
		</div>
	</div>
</div>

