<script lang="ts">
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	const assignedRole = $derived(form?.role);
	const error = $derived(form?.error);
</script>

<div class="flex justify-center items-center min-h-screen p-4">
	<div class="card bg-base-200 w-full max-w-md">
		<div class="card-body">
			{#if error}
				<div class="text-center">
					<h2 class="card-title justify-center mb-4">Error</h2>
					<p class="text-error mb-4">{error}</p>
					<a href="/" class="btn btn-primary">Go to Home</a>
				</div>
			{:else if assignedRole}
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
