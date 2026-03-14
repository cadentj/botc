<script lang="ts">
	import type { Character, HelperToken } from '$lib/types/characters';
	import { Skull, HeartPulse, X, Plus, Settings2, UserRoundPlus, UserRoundX, Save } from '@lucide/svelte';
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
		knownPlayers?: string[];
		availableHelperTokens?: HelperToken[];
		updatePlayerAssignment?: (characterName: string, playerName: string) => Promise<void>;
	}

	let { data }: { data: TokenData } = $props();

	let isDead = $state(false);
	let helperTokenIds = $state<string[]>([]);
	let modal: HTMLDialogElement;
	let manualPlayerName = $state('');
	let assignmentError = $state('');
	let savingAssignment = $state(false);

	const IconComponent = $derived(data.character.icon);
	const playerOptionsId = $derived(
		`player-options-${data.character.name.toLowerCase().replace(/\s+/g, '-')}`
	);
	const availableHelperTokens = $derived(data.availableHelperTokens || []);
	const knownPlayers = $derived(data.knownPlayers || []);
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

	function stopNodeInteraction(event: Event) {
		event.stopPropagation();
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

	function openAssignmentModal(event: MouseEvent) {
		event.stopPropagation();
		assignmentError = '';
		manualPlayerName = data.playerName ?? '';
		modal.showModal();
	}

	async function saveAssignment(event: SubmitEvent) {
		event.preventDefault();
		event.stopPropagation();

		const playerName = manualPlayerName.trim();
		if (!playerName) {
			assignmentError = 'Enter a player name to assign.';
			return;
		}

		if (!data.updatePlayerAssignment) {
			assignmentError = 'Assignment controls are unavailable.';
			return;
		}

		savingAssignment = true;
		assignmentError = '';

		try {
			await data.updatePlayerAssignment(data.character.name, playerName);
			modal.close();
		} catch (error) {
			assignmentError =
				error instanceof Error ? error.message : 'Failed to update player assignment.';
		} finally {
			savingAssignment = false;
		}
	}

	async function clearAssignment(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();

		if (!data.updatePlayerAssignment) {
			assignmentError = 'Assignment controls are unavailable.';
			return;
		}

		savingAssignment = true;
		assignmentError = '';

		try {
			await data.updatePlayerAssignment(data.character.name, '');
			manualPlayerName = '';
			modal.close();
		} catch (error) {
			assignmentError =
				error instanceof Error ? error.message : 'Failed to remove player assignment.';
		} finally {
			savingAssignment = false;
		}
	}
</script>

<div class="card relative bg-base-200 p-3 w-44 border-2 border-base-300" class:opacity-50={isDead}>
	<div class="absolute -top-3 -right-3 flex items-center gap-1">
		<button
			class="size-6 rounded-full border-base-300 border-2 bg-base-200 flex items-center justify-center"
			onclick={openAssignmentModal}
			onmousedown={stopNodeInteraction}
			title={data.playerName ? 'Edit assigned player' : 'Assign player'}
		>
			{#if data.playerName}
				<Settings2 size={11} />
			{:else}
				<UserRoundPlus size={11} />
			{/if}
		</button>
		<button
			class="size-6 rounded-full  border-base-300 border-2 flex items-center justify-center"
			onclick={handleToggleDead}
			onmousedown={(e) => e.stopPropagation()}
			title={isDead ? 'Mark as alive' : 'Mark as dead'}
		>
			{#if isDead}
				<Skull size={11} class="text-red-500" />
			{:else}
				<HeartPulse size={11} class="text-green-500" />
			{/if}
		</button>
	</div>

	<div class="flex flex-row gap-3">
		<IconComponent size={16} class="min-w-5 h-5 {typeColors[data.character.type] || ''}" />
		<div class="flex flex-1 flex-col gap-1">
			<h3 class="font-medium text-sm">{data.character.name}</h3>
			{#if data.playerName}
				<span class="text-xs text-base-content/60">{data.playerName}</span>
			{:else}
				<span class="text-xs text-base-content/40">Unassigned</span>
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

<dialog class="modal" bind:this={modal}>
	<div class="modal-box max-w-xs">
		<form method="dialog">
			<button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
		</form>
		<h3 class="text-lg font-bold">Assign player to {data.character.name}</h3>
		<form class="mt-4 flex flex-col gap-2" onsubmit={saveAssignment}>
			<label class="input input-sm input-bordered flex items-center gap-2">
				<input
					class="grow text-sm"
					type="text"
					bind:value={manualPlayerName}
					list={knownPlayers.length > 0 ? playerOptionsId : undefined}
					placeholder="Player name"
					onmousedown={stopNodeInteraction}
				/>
			</label>

			{#if knownPlayers.length > 0}
				<datalist id={playerOptionsId}>
					{#each knownPlayers as knownPlayer}
						<option value={knownPlayer}></option>
					{/each}
				</datalist>
			{/if}

			<div class="flex items-center gap-2">
				<button
					type="submit"
					class="btn btn-primary btn-sm flex-1"
					disabled={savingAssignment}
					onmousedown={stopNodeInteraction}
				>
					<Save size={12} />
					<span>{savingAssignment ? 'Saving...' : 'Save'}</span>
				</button>

				{#if data.playerName}
					<button
						type="button"
						class="btn btn-error btn-outline btn-sm"
						disabled={savingAssignment}
						onclick={clearAssignment}
						onmousedown={stopNodeInteraction}
					>
						<UserRoundX size={12} />
						<span>Remove</span>
					</button>
				{/if}
			</div>

			{#if assignmentError}
				<p class="text-xs text-error">{assignmentError}</p>
			{/if}
		</form>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>