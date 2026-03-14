<script lang="ts">
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    import { CHARACTERS_BY_TYPE } from "$lib/botc-data/trouble-brewing.svelte";
    import type { CharacterType } from "$lib/types/characters";
    import { BookOpen } from "@lucide/svelte";

    const PLAYER_NAME_KEY = "botc-player-name";
    const ASTERISK_NOTE = "* Not on the first night.";

    const code = $page.params.code;

    let loading = $state(true);
    let error = $state<string | null>(null);
    let role = $state<{ name: string; type: string; ability: string } | null>(
        null
    );
    let modal: HTMLDialogElement;

    // Find the full character object to get the icon
    const character = $derived.by(() => {
        const currentRole = role;
        if (!currentRole) return null;
        for (const characters of Object.values(CHARACTERS_BY_TYPE)) {
            const char = characters.find((c) => c.name === currentRole.name);
            if (char) return char;
        }
        return null;
    });

    const referenceHasAsteriskNote = Object.values(CHARACTERS_BY_TYPE)
        .flat()
        .some((char) => char.ability.includes("*"));

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

<div class="flex justify-center items-center h-dvh">
    <div class="flex flex-col gap-3 w-full max-w-xs">
        <div
            class="alert alert-info alert-soft flex flex-row gap-2 items-center justify-between"
        >
            <span class="text-sm">Your Role</span>
            {#if role && character}
                <!-- Alert with reference button -->
                <button
                    class="cursor-pointer hover:text-primary transition-colors flex flex-row gap-2 items-center"
                    onclick={() => modal.showModal()}
                >
                    <span class="text-sm">All Roles</span>
                    <BookOpen size={12} />
                </button>
            {/if}
        </div>

        <!-- Status Card -->
        <div class="card border border-base-300 bg-base-200 w-full">
            <div class="card-body p-3">
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
                {:else if role && character}
                    <div class="flex flex-row gap-3 text-left">
                        <character.icon size={16} class="min-w-5 h-5" />
                        <div class="flex flex-1 flex-col">
                            <div
                                class="flex flex-row gap-2 justify-between items-center"
                            >
                                <h3 class="font-medium text-sm">{role.name}</h3>
                                {#if character.firstNightOrder && !character.otherNightOrder}
                                    <span
                                        class="badge badge-xs badge-soft badge-primary"
                                        >First Night</span
                                    >
                                {/if}
                                {#if character.otherNightOrder}
                                    <span
                                        class="badge badge-xs badge-soft badge-secondary"
                                        >Every Night</span
                                    >
                                {/if}
                                {#if !character.firstNightOrder && !character.otherNightOrder}
                                    <span
                                        class="badge badge-xs badge-soft badge-accent"
                                        >One Time</span
                                    >
                                {/if}
                            </div>
                            <p class="text-xs text-base-content/60 mt-1">
                                {role.ability}
                            </p>
                            {#if role.ability.includes("*")}
                                <p class="text-[11px] text-base-content/50 mt-2">
                                    {ASTERISK_NOTE}
                                </p>
                            {/if}
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>

<!-- Character Reference Modal -->
<dialog class="modal" bind:this={modal}>
    <div
        class="modal-box max-w-5xl max-h-[80vh] p-0 flex flex-col overflow-hidden"
    >
        <div
            class="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-base-300 bg-base-100/95 px-6 py-4 backdrop-blur"
        >
            <div class="min-w-0">
                <h3 class="text-lg font-bold">Character Reference</h3>
                {#if referenceHasAsteriskNote}
                    <p class="text-xs text-base-content/60 mt-1">
                        {ASTERISK_NOTE}
                    </p>
                {/if}
            </div>
            <form method="dialog" class="shrink-0">
                <button class="btn btn-sm btn-circle btn-ghost">✕</button>
            </form>
        </div>

        <div class="flex-1 min-h-0 overflow-y-auto px-6 py-4">
            <div class="flex flex-col gap-6">
                {#each ["townsfolk", "outsiders", "minions", "demons"] as type}
                    {@const charType = type as CharacterType}
                    <section class="flex flex-col gap-3">
                        <div class="divider">
                            {charType.charAt(0).toUpperCase() + charType.slice(1)}
                        </div>
                        <div
                            class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3"
                        >
                            {#each CHARACTERS_BY_TYPE[charType] as char}
                                <div
                                    class="card flex flex-row gap-3 bg-base-200 p-3 text-left border-2 border-transparent"
                                >
                                    <char.icon size={16} class="min-w-5 h-5" />
                                    <div class="flex flex-1 flex-col">
                                        <div
                                            class="flex flex-row gap-2 justify-between items-center"
                                        >
                                            <h3 class="font-medium text-sm">
                                                {char.name}
                                            </h3>

                                            {#if char.firstNightOrder && !char.otherNightOrder}
                                                <span
                                                    class="badge badge-xs badge-soft badge-primary"
                                                    >First Night</span
                                                >
                                            {/if}
                                            {#if char.otherNightOrder}
                                                <span
                                                    class="badge badge-xs badge-soft badge-secondary"
                                                    >Every Night</span
                                                >
                                            {/if}
                                            {#if !char.firstNightOrder && !char.otherNightOrder}
                                                <span
                                                    class="badge badge-xs badge-soft badge-accent"
                                                    >One Time</span
                                                >
                                            {/if}
                                        </div>
                                        <p
                                            class="text-xs text-base-content/60 mt-1 line-clamp-3"
                                        >
                                            {char.ability}
                                        </p>
                                        {#if char.ability.includes("*")}
                                            <p
                                                class="text-[11px] text-base-content/50 mt-2"
                                            >
                                                {ASTERISK_NOTE}
                                            </p>
                                        {/if}
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </section>
                {/each}
            </div>
        </div>
    </div>
    <form method="dialog" class="modal-backdrop">
        <button>close</button>
    </form>
</dialog>
