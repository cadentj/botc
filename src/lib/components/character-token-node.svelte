<script lang="ts">
	import type { Character } from '$lib/types/characters';
	import { Skull, HeartPulse, X } from '@lucide/svelte';

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
	}

	const REMINDERS = ['Poisoned', 'Drunk', 'Dead', 'Protected', 'Nominated'] as const;

	// SvelteFlow passes the node data directly as props
	let { data }: { data: TokenData } = $props();

	let reminders = $state<string[]>([]);

	const typeColor = $derived(TYPE_COLORS[data.character.type] ?? '#6b7280');
	const IconComponent = $derived(data.character.icon);

	function handleToggleDead(e: MouseEvent) {
		e.stopPropagation();
		data.onToggleDead();
	}

	function addReminder(reminder: string) {
		reminders = [...reminders, reminder];
	}

	function removeReminder(index: number) {
		reminders = reminders.filter((_, i) => i !== index);
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
		{#each reminders as reminder, i}
			<button
				class="badge badge-sm badge-secondary cursor-pointer hover:badge-error gap-0.5"
				onclick={() => removeReminder(i)}
				title="Click to remove"
			>
				{reminder}
				<X size={10} />
			</button>
		{/each}

		<div class="dropdown dropdown-bottom -mt-1">
			<div tabindex="0" role="button" class="badge badge-sm badge-outline cursor-pointer">Add +</div>
			<ul role="menu" tabindex="0" class="dropdown-content menu bg-base-200 rounded-box z-10 w-32 p-2 shadow-sm">
				{#each REMINDERS as reminder}
					<li><button onclick={() => addReminder(reminder)}>{reminder}</button></li>
				{/each}
			</ul>
		</div>
	</div>
</div>