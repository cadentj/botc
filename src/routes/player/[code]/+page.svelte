<script lang="ts">
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";

    const PLAYER_NAME_KEY = "botc-player-name";

    const code = $page.params.code;

    let loading = $state(true);
    let error = $state<string | null>(null);
    let role = $state<{ name: string; type: string; ability: string } | null>(null);

    onMount(async () => {
        const playerName = localStorage.getItem(PLAYER_NAME_KEY);

        if (!playerName) {
            goto(`/?code=${code}`);
            return;
        }

        try {
            const response = await fetch(`/api/lobby/${code}/join`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ playerName }),
            });

            if (!response.ok) {
                const data = await response.json();
                error = data.message || "Failed to join lobby";
                loading = false;
                return;
            }

            const data = await response.json();
            role = data.role;
        } catch (e) {
            error = "Failed to connect to server";
        } finally {
            loading = false;
        }
    });
</script>

<div class="flex justify-center items-center min-h-screen p-4">
    <div class="card bg-base-200 w-full max-w-md">
        <div class="card-body">
            {#if loading}
                <div class="text-center">
                    <span class="loading loading-spinner loading-lg"></span>
                    <p class="mt-4">Joining lobby...</p>
                </div>
            {:else if error}
                <div class="text-center">
                    <h2 class="card-title justify-center mb-4">Error</h2>
                    <p class="text-error mb-4">{error}</p>
                    <a href="/" class="btn btn-primary">Go to Home</a>
                </div>
            {:else if role}
                <div class="text-center">
                    <h2 class="card-title justify-center mb-4">Your Role</h2>
                    <div class="bg-base-100 rounded-lg p-6 mb-4">
                        <h3 class="text-2xl font-bold mb-2">{role.name}</h3>
                        <p class="text-sm text-base-content/70 mb-4 capitalize">{role.type}</p>
                        <p class="text-base">{role.ability}</p>
                    </div>
                    <p class="text-sm text-base-content/70">
                        Wait for the storyteller to begin the game.
                    </p>
                </div>
            {/if}
        </div>
    </div>
</div>
