<script lang="ts">
	import type { Character, HelperToken } from '$lib/types/characters';
	import { Skull, HeartPulse, X, Plus } from '@lucide/svelte';
	import { CHARACTERS_BY_TYPE } from '$lib/botc-data/trouble-brewing.svelte';

	const typeColors: Record<string, string> = {
		townsfolk: 'text-blue-500',
		outsiders: 'text-cyan-500',
		minions: 'text-orange-500',
		demons: 'text-red-500',
	};

	export interface TokenData extends Record<string, unknown> {
		character: Character;
		playerName?: string;
		availableHelperTokens?: HelperToken[];
	}

	let { data }: { data: TokenData } = $props();

	let isDead = $state(false);
	let helperTokenIds = $state<string[]>([]);

	const IconComponent = $derived(data.character.icon);
	const availableHelperTokens = $derived(data.availableHelperTokens || []);
	const assignedHelperTokens = $derived(
		availableHelperTokens.filter((ht) => helperTokenIds.includes(ht.id))
	);
	const unassignedHelperTokens = $derived(
		availableHelperTokens.filter((ht) => !helperTokenIds.includes(ht.id))
	);

	function handleToggleDead(e: MouseEvent) {
		e.stopPropagation();
		isDead = !isDead;
	}

	function addHelperToken(helperTokenId: string) {
		if (!helperTokenIds.includes(helperTokenId)) {
			helperTokenIds = [...helperTokenIds, helperTokenId];
		}
	}

	function removeHelperToken(helperTokenId: string) {
		helperTokenIds = helperTokenIds.filter((id) => id !== helperTokenId);
	}

	function getCharacterForHelperToken(helperToken: HelperToken): Character | null {
		for (const characters of Object.values(CHARACTERS_BY_TYPE)) {
			const character = characters.find((c) => c.name === helperToken.forCharacter);
			if (character) return character;
		}
		return null;
	}
</script>

<div class="card relative bg-base-200 p-3 w-44 border-2 border-base-300" class:opacity-50={isDead}>
	<button
		class="absolute -top-2 -right-2 size-6 rounded-full bg-base-300 flex items-center justify-center"
		onclick={handleToggleDead}
		onmousedown={(e) => e.stopPropagation()}
		title={isDead ? 'Mark as alive' : 'Mark as dead'}
	>
		{#if isDead}
			<Skull size={12} class="text-red-500" />
		{:else}
			<HeartPulse size={12} class="text-green-500" />
		{/if}
	</button>

	<div class="flex flex-row gap-3">
		<IconComponent size={16} class="min-w-5 h-5 {typeColors[data.character.type] || ''}" />
		<div class="flex flex-col">
			<h3 class="font-medium text-sm">{data.character.name}</h3>
			{#if data.playerName}
				<span class="text-xs text-base-content/60">{data.playerName}</span>
			{/if}
		</div>
	</div>

	{#if assignedHelperTokens.length > 0 || unassignedHelperTokens.length > 0}
		<div class="flex flex-wrap gap-1 mt-3">
			{#each assignedHelperTokens as helperToken}
				{@const char = getCharacterForHelperToken(helperToken)}
				{@const CharIcon = char?.icon}
				<button
					class="badge badge-sm badge-accent cursor-pointer hover:badge-error gap-1.5"
					onclick={() => removeHelperToken(helperToken.id)}
					onmousedown={(e) => e.stopPropagation()}
					title="Click to remove"
				>
					{#if CharIcon}
						<CharIcon size={12} />
					{/if}
					<span>{helperToken.name}</span>
					<X size={10} />
				</button>
			{/each}

			{#if unassignedHelperTokens.length > 0}
				<div class="dropdown dropdown-bottom">
					<div tabindex="0" role="button" class="badge badge-sm badge-outline cursor-pointer gap-0.5">
						<Plus size={10} />
						<span>Add</span>
					</div>
					<ul role="menu" tabindex="0" class="dropdown-content menu bg-base-200 rounded-box z-10 w-40 p-2">
						{#each unassignedHelperTokens as helperToken}
							{@const char = getCharacterForHelperToken(helperToken)}
							{@const CharIcon = char?.icon}
							<li>
								<button onclick={() => addHelperToken(helperToken.id)} class="flex items-center gap-2 w-full">
									{#if CharIcon}
										<CharIcon size={14} />
									{/if}
									<div class="flex flex-col items-start">
										<span class="text-xs text-base-content/70">{helperToken.forCharacter}</span>
										<span class="text-xs font-medium">{helperToken.name}</span>
									</div>
								</button>
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		</div>
	{/if}
</div>