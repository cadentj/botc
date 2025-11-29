<script lang="ts">
	import { page } from '$app/stores';
	import Grimoire from '$lib/components/grimoire.svelte';
	import NightOrderSheet from '$lib/components/night-order-sheet.svelte';
	import NightHelperCards from '$lib/components/night-helper-cards.svelte';
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
	const lobbyCode = $derived($page.params.code || '');

	// Character to player mapping (will be updated by Grimoire component)
	let characterToPlayer = $state<Record<string, string>>({});

	// Share state
	let shared = $state(false);

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

	function getJoinUrl() {
		return `${window.location.origin}/?code=${lobbyCode}`;
	}

	async function handleShare() {
		const joinUrl = getJoinUrl();
		const shareData = {
			title: 'Join Blood on the Clocktower',
			text: `Join my game with code: ${lobbyCode}`,
			url: joinUrl,
		};

		// Try native share API (mobile devices)
		if (navigator.share && navigator.canShare?.(shareData)) {
			try {
				await navigator.share(shareData);
				shared = true;
				setTimeout(() => (shared = false), 2000);
			} catch (err) {
				// User cancelled
				if ((err as Error).name === 'AbortError') return;
				console.error('Share failed:', err);
			}
		}
	}

	let activeTab = $state("book");
	let helperMode = $state(false);
	let showAllRoles = $state(false);
</script>

<svelte:head>
	<title>Grimoire</title>
</svelte:head>

<div class="h-dvh flex flex-col overflow-hidden">
	<!-- Header -->
	<header class="flex justify-between items-center px-6 py-3 bg-base-100 border-b border-base-300 shrink-0">
		<div class="flex items-center gap-2">
			<span class="text-sm text-base-content/70">Game Code:</span>
			<span class="text-sm text-warning">
				{lobbyCode}
			</span>
			<button
				class="btn btn-ghost btn-xs btn-square"
				onclick={handleShare}
				title="Share join link"
			>
				{#if shared}
					<Check size={12} class="text-success" />
				{:else}
					<Share size={12} />
				{/if}
			</button>
		</div>
		<div role="tablist" class="tabs tabs-box tabs-xs md:hidden">
			<button role="tab" class="tab" class:tab-active={activeTab === "book"} onclick={() => activeTab = "book"}>Book</button>
			<button role="tab" class="tab" class:tab-active={activeTab === "roles"} onclick={() => activeTab = "roles"}>Roles</button>
		</div>
	</header>

	<!-- Main content -->
	<div class="flex-1 flex overflow-hidden min-h-0">
		<!-- Grimoire or Helper Cards -->
		<div 
			class="w-full md:w-2/3 h-full overflow-hidden md:block" 
			class:hidden={activeTab === "roles"}
		>
			{#if helperMode}
				<NightHelperCards />
			{:else}
				<Grimoire bind:characterToPlayer {lobbyCode} />
			{/if}
		</div>
	
		<!-- Night Order -->
		<div 
			class="w-full md:w-1/3 h-full border-l border-base-300 flex-col"
			class:hidden={activeTab === "book"}
			class:flex={activeTab === "roles"}
			class:md:flex={true}
		>
			<div class="flex-1 overflow-y-auto min-h-0">
				{#if helperMode}
					<!-- On mobile, show helper cards here instead of night order -->
					<div class="md:hidden h-full">
						<NightHelperCards />
					</div>
					<!-- On desktop, still show night order sheet -->
					<div class="hidden md:block">
						<NightOrderSheet 
							characters={characters()} 
							{showAllRoles}
						/>
					</div>
				{:else}
					<NightOrderSheet 
						characters={characters()} 
						{showAllRoles}
					/>
				{/if}
			</div>
			<!-- Footer -->
			<div class="shrink-0 p-3 border-t border-base-300 flex justify-between items-center bg-base-100">
				<button
					class="btn btn-sm"
					onclick={() => {
						helperMode = !helperMode;
						if (helperMode) {
							showAllRoles = true;
						}
						if (!helperMode) {
							showAllRoles = false;
						}
					}}
					title="Toggle helper cards for players"
				>
					<span class="text-sm">{helperMode ? "Hide Helper Cards" : "Show Helper Cards"}</span>
				</button>
				<label class="flex items-center gap-2 cursor-pointer">
					<input type="checkbox" class="toggle toggle-sm" bind:checked={showAllRoles} />
					<span class="text-sm">Show all</span>
				</label>
			</div>
		</div>
	</div>
</div>
