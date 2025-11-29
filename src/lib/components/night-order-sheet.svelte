<script lang="ts">
	import type { Character } from '$lib/types/characters';
	import { CHARACTERS_BY_TYPE } from '$lib/botc-data/trouble-brewing.svelte';

	let { 
		characters,
		showAllRoles = false
	}: { 
		characters: Character[];
		showAllRoles?: boolean;
	} = $props();

	const typeColors: Record<string, string> = {
		townsfolk: 'text-blue-500',
		outsiders: 'text-cyan-500',
		minions: 'text-orange-500',
		demons: 'text-red-500',
	};

	// All characters from the script
	const allCharacters = $derived([
		...CHARACTERS_BY_TYPE.townsfolk,
		...CHARACTERS_BY_TYPE.outsiders,
		...CHARACTERS_BY_TYPE.minions,
		...CHARACTERS_BY_TYPE.demons,
	]);

	// Characters to display based on toggle
	const displayCharacters = $derived(showAllRoles ? allCharacters : characters);

	// Sort characters by firstNightOrder
	const firstNight = $derived(
		displayCharacters
			.filter((c) => c.firstNightOrder !== undefined)
			.sort((a, b) => (a.firstNightOrder || 0) - (b.firstNightOrder || 0))
	);

	// Sort characters by otherNightOrder
	const otherNights = $derived(
		displayCharacters
			.filter((c) => c.otherNightOrder !== undefined)
			.sort((a, b) => (a.otherNightOrder || 0) - (b.otherNightOrder || 0))
	);

	// Characters without night actions
	const noNightAction = $derived(
		displayCharacters.filter(
			(c) => c.firstNightOrder === undefined && c.otherNightOrder === undefined
		)
	);
</script>

<div class="flex flex-col bg-base-100">
	<!-- Scrollable content -->
	<div class="flex-1 p-6 overflow-y-auto min-h-0">
		<div class="flex flex-col gap-8">
			<section class="flex-1">
				<div class="divider">First Night</div>
				{#if firstNight.length === 0}
					<p class="text-base-content/70 italic">No characters wake on the first night</p>
				{:else}
					<ol class="list-none p-0 m-0 flex flex-col gap-2">
						{#each firstNight as char}
							{@const CharIcon = char.icon}
							<li class="card flex flex-row gap-3 bg-base-200 p-3">
								<CharIcon size={16} class="min-w-5 h-5 {typeColors[char.type] || ''}" />
								<div class="flex flex-1 flex-col">
									<h3 class="font-medium text-sm">{char.name}</h3>
									<p class="text-xs text-base-content/60 mt-1 line-clamp-3">{char.ability}</p>
								</div>
							</li>
						{/each}
					</ol>
				{/if}
			</section>

			<section class="flex-1">
				<div class="divider">Other Nights</div>
				{#if otherNights.length === 0}
					<p class="text-base-content/70 italic">No characters wake on other nights</p>
				{:else}
					<ol class="list-none p-0 m-0 flex flex-col gap-2">
						{#each otherNights as char}
							{@const CharIcon = char.icon}
							<li class="card flex flex-row gap-3 bg-base-200 p-3">
								<CharIcon size={16} class="min-w-5 h-5 {typeColors[char.type] || ''}" />
								<div class="flex flex-1 flex-col">
									<h3 class="font-medium text-sm">{char.name}</h3>
									<p class="text-xs text-base-content/60 mt-1 line-clamp-3">{char.ability}</p>
								</div>
							</li>
						{/each}
					</ol>
				{/if}
			</section>

			{#if noNightAction.length > 0}
				<section class="flex-1">
					<div class="divider">No Night Action</div>
					<ul class="list-none p-0 m-0 flex flex-col gap-2">
						{#each noNightAction as char}
							{@const CharIcon = char.icon}
							<li class="card flex flex-row gap-3 bg-base-200 p-3">
								<CharIcon size={16} class="min-w-5 h-5 {typeColors[char.type] || ''}" />
								<div class="flex flex-1 flex-col">
									<h3 class="font-medium text-sm">{char.name}</h3>
									<p class="text-xs text-base-content/60 mt-1 line-clamp-3">{char.ability}</p>
								</div>
							</li>
						{/each}
					</ul>
				</section>
			{/if}
		</div>
	</div>
</div>

