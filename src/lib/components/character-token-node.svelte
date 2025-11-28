<script lang="ts">
	import type { Character, HelperToken } from '$lib/types/characters';
	import { Skull, HeartPulse, X, Plus } from '@lucide/svelte';
	import { CHARACTERS_BY_TYPE } from '$lib/botc-data/trouble-brewing.svelte';

	const TYPE_COLORS: Record<string, string> = {
		townsfolk: '#3b82f6',
		outsiders: '#06b6d4',
		minions: '#f97316',
		demons: '#ef4444',
	};

	export interface TokenData extends Record<string, unknown> {
		character: Character;
		isDead: boolean;
		onToggleDead: () => void;
		playerName?: string;
		availableHelperTokens?: HelperToken[];
	}

	// SvelteFlow passes the node data directly as props
	let { data }: { data: TokenData } = $props();

	let helperTokenIds = $state<string[]>([]);

	const typeColor = $derived(TYPE_COLORS[data.character.type] ?? '#6b7280');
	const IconComponent = $derived(data.character.icon);
	const availableHelperTokens = $derived(data.availableHelperTokens || []);

	// Get assigned helper tokens
	const assignedHelperTokens = $derived(
		availableHelperTokens.filter((ht) => helperTokenIds.includes(ht.id))
	);

	// Get unassigned helper tokens
	const unassignedHelperTokens = $derived(
		availableHelperTokens.filter((ht) => !helperTokenIds.includes(ht.id))
	);

	function handleToggleDead(e: MouseEvent) {
		e.stopPropagation();
		data.onToggleDead();
	}

	function addHelperToken(helperTokenId: string) {
		if (!helperTokenIds.includes(helperTokenId)) {
			helperTokenIds = [...helperTokenIds, helperTokenId];
		}
	}

	function removeHelperToken(helperTokenId: string) {
		helperTokenIds = helperTokenIds.filter((id) => id !== helperTokenId);
	}

	// Get character for a helper token
	function getCharacterForHelperToken(helperToken: HelperToken): Character | null {
		for (const characters of Object.values(CHARACTERS_BY_TYPE)) {
			const character = characters.find((c) => c.name === helperToken.forCharacter);
			if (character) return character;
		}
		return null;
	}
</script>

<div
	class="relative flex flex-col items-center justify-start pt-10 size-40 bg-primary rounded-full"
	class:dead={data.isDead}
	style="--type-color: {typeColor}"
>
	<button
		class="absolute top-2 right-2 bg-base-300 size-8 rounded-full flex items-center justify-center"
		onclick={handleToggleDead}
		onmousedown={(e) => e.stopPropagation()}
		title={data.isDead ? 'Mark as alive' : 'Mark as dead'}
	>
		{#if data.isDead}
			<Skull size={12} class="text-red-500" />
		{:else}
			<HeartPulse size={12} class="text-green-500" />
		{/if}
	</button>

	<div style="color: var(--type-color);">
		<IconComponent size={24} />
	</div>

	<span>{data.character.name}</span>
	{#if data.playerName}
		<span class="text-xs text-base-content/70 mt-1">{data.playerName}</span>
	{/if}

	<!-- Badges stay in flow, will overflow below circle -->
	<div class="flex items-center flex-wrap pt-1 gap-1 justify-center max-w-36">
		{#each assignedHelperTokens as helperToken}
			{@const char = getCharacterForHelperToken(helperToken)}
			{@const CharIcon = char?.icon}
			<button
				class="badge badge-sm badge-secondary cursor-pointer hover:badge-error gap-0.5"
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
			<div class="dropdown dropdown-bottom -mt-1">
				<div tabindex="0" role="button" class="badge badge-sm badge-outline cursor-pointer flex items-center gap-0.5">
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
</div>