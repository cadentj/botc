<script lang="ts">
	import type { Character } from '$lib/types/characters';
	import {
		Skull,
		HeartPulse,
		Shirt,
		BookOpen,
		Search,
		ChefHat,
		Heart,
		Sparkles,
		Shield,
		Bird,
		Flower2,
		Crosshair,
		Swords,
		Crown,
		Wine,
		Beer,
		Ghost,
		Cross,
		FlaskConical,
		Eye,
		Castle,
		HeartCrack,
		Flame,
		HelpCircle,
	} from '@lucide/svelte';

	const ICONS: Record<string, typeof Skull> = {
		Skull,
		Shirt,
		BookOpen,
		Search,
		ChefHat,
		Heart,
		Sparkles,
		Shield,
		Bird,
		Flower2,
		Crosshair,
		Swords,
		Crown,
		Wine,
		Beer,
		Ghost,
		Cross,
		FlaskConical,
		Eye,
		Castle,
		HeartCrack,
		Flame,
	};

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
	}

	// SvelteFlow passes the node data directly as props
	let { data }: { data: TokenData } = $props();

	const typeColor = $derived(TYPE_COLORS[data.character.type] ?? '#6b7280');
	const IconComponent = $derived(ICONS[data.character.icon] ?? HelpCircle);

	function handleToggleDead(e: MouseEvent) {
		e.stopPropagation();
		data.onToggleDead();
	}
</script>

<div
	class="flex flex-col items-center justify-center size-40 bg-primary rounded-full"
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

	<div class="dropdown dropdown-bottom">
		<div tabindex="0" role="button" class="btn btn-xs btn-dash">Add +</div>
		<ul role="menu" tabindex="0" class="dropdown-content menu bg-base-200 rounded-box z-10 w-40 p-2 shadow-sm">
			<li><button>Poisoned</button></li>
			<li><button>Drunk</button></li>
			<!-- etc -->
		</ul>
	</div>
</div>

