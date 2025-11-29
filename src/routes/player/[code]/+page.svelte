<script lang="ts">
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    import { CHARACTERS_BY_TYPE } from "$lib/botc-data/trouble-brewing.svelte";
    import type { CharacterType } from "$lib/types/characters";

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

<div class="flex flex-col items-center min-h-screen p-4">
    <!-- Status Card -->
    <div class="card bg-base-200 w-full max-w-md mb-8">
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

    <!-- Character Reference -->
    <div class="max-w-5xl w-full flex flex-col gap-6">
        <h2 class="text-xl font-bold text-center">Character Reference</h2>
        
        {#each ["townsfolk", "outsiders", "minions", "demons"] as type}
            {@const charType = type as CharacterType}
            <section class="flex flex-col gap-3">
                <div class="divider">
                    {charType.charAt(0).toUpperCase() + charType.slice(1)}
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {#each CHARACTERS_BY_TYPE[charType] as char}
                        {@const isYourRole = role?.name === char.name}
                        <div
                            class="card flex flex-row gap-3 bg-base-200 p-3 text-left border-2"
                            class:border-primary={isYourRole}
                            class:border-transparent={!isYourRole}
                        >
                            <char.icon size={16} class="min-w-5 h-5" />
                            <div class="flex flex-1 flex-col">
                                <div class="flex flex-row gap-2 justify-between items-center">
                                    <h3 class="font-medium text-sm">
                                        {char.name}
                                        {#if isYourRole}
                                            <span class="text-primary">(You)</span>
                                        {/if}
                                    </h3>

                                    {#if char.firstNightOrder && !char.otherNightOrder}
                                        <span class="badge badge-xs badge-soft badge-primary">First Night</span>
                                    {/if}
                                    {#if char.otherNightOrder}
                                        <span class="badge badge-xs badge-soft badge-secondary">Every Night</span>
                                    {/if}
                                    {#if !char.firstNightOrder && !char.otherNightOrder}
                                        <span class="badge badge-xs badge-soft badge-accent">One Time</span>
                                    {/if}
                                </div>
                                <p class="text-xs text-base-content/60 mt-1 line-clamp-3">
                                    {char.ability}
                                </p>
                            </div>
                        </div>
                    {/each}
                </div>
            </section>
        {/each}
    </div>
</div>
