<script lang="ts">
	import { page } from '$app/stores';
	import { getAssignedRole } from '$lib/stores/player.svelte';

	const lobbyCode = $derived($page.params.code || '');
	const assignedRole = $derived(getAssignedRole());
</script>

<svelte:head>
	<title>Your Role - {lobbyCode}</title>
</svelte:head>

<div class="flex justify-center items-center min-h-screen p-4">
	<div class="card bg-base-200 w-full max-w-md">
		<div class="card-body">
			{#if assignedRole}
				<div class="text-center">
					<h2 class="card-title justify-center mb-4">Your Role</h2>
					<div class="bg-base-100 rounded-lg p-6 mb-4">
						<h3 class="text-2xl font-bold mb-2">{assignedRole.name}</h3>
						<p class="text-sm text-base-content/70 mb-4 capitalize">{assignedRole.type}</p>
						<p class="text-base">{assignedRole.ability}</p>
					</div>
					<p class="text-sm text-base-content/70">
						Wait for the storyteller to begin the game.
					</p>
				</div>
			{:else}
				<div class="text-center">
					<h2 class="card-title justify-center mb-4">No Role Assigned</h2>
					<p class="text-base-content/70 mb-4">
						You haven't joined a lobby yet.
					</p>
					<a href="/" class="btn btn-primary">Go to Home</a>
				</div>
			{/if}
		</div>
	</div>
</div>
