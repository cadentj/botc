<script lang="ts">
    import {
        SvelteFlow,
        Background,
        BackgroundVariant,
        type Node,
        type Edge,
    } from "@xyflow/svelte";
    import "@xyflow/svelte/dist/style.css";
    import CharacterTokenNode, {
        type TokenData,
    } from "$lib/components/character-token-node.svelte";
    import {
        CHARACTERS_BY_TYPE,
        HELPER_TOKENS,
    } from "$lib/botc-data/trouble-brewing.svelte";
    import { onMount, onDestroy } from "svelte";
    import type { Character } from "$lib/types/characters";
    import { Save, UserRoundX } from "@lucide/svelte";

    function findCharacterByName(name: string): Character | null {
        for (const characters of Object.values(CHARACTERS_BY_TYPE)) {
            const character = characters.find((c) => c.name === name);
            if (character) return character;
        }
        return null;
    }

    let {
        lobbyCode,
        characterToPlayer = $bindable({}),
    }: { lobbyCode: string; characterToPlayer: Record<string, string> } =
        $props();

    let pollInterval: ReturnType<typeof setInterval> | null = null;
    let countdownInterval: ReturnType<typeof setInterval> | null = null;
    let pollStartTime = $state<number | null>(null);
    let remainingSeconds = $state(5 * 60);
    let isPolling = $state(true);
    let lobbyNotFound = $state(false);
    let assignmentModal: HTMLDialogElement;
    let assignmentCharacterName = $state<string | null>(null);
    let assignmentPlayerName = $state("");
    let assignmentError = $state("");
    let savingAssignment = $state(false);
    const POLL_DURATION = 5 * 60 * 1000; // 5 minutes
    const POLL_INTERVAL = 10 * 1000; // 10 seconds
    const assignmentKnownPlayers = $derived(getKnownPlayers(characterToPlayer));
    const assignmentOptionsId = $derived(
        assignmentCharacterName
            ? `player-options-${assignmentCharacterName.toLowerCase().replace(/\s+/g, "-")}`
            : "player-options-assignment"
    );

    function getKnownPlayers(charToPlayer: Record<string, string>): string[] {
        return [...new Set(
            Object.values(charToPlayer)
                .map((playerName) => playerName.trim())
                .filter(Boolean)
        )].sort((a, b) => a.localeCompare(b));
    }

    // Get available helper tokens based on selected characters
    const availableHelperTokens = $derived.by(() => {
        const selectedCharacterNames = Object.keys(characterToPlayer);
        return HELPER_TOKENS.filter((ht) =>
            ht.alwaysAvailable || selectedCharacterNames.includes(ht.forCharacter)
        );
    });

    function stopPolling() {
        if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
        }
        if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
        }
        isPolling = false;
    }

    function openAssignmentDialog(characterName: string) {
        assignmentCharacterName = characterName;
        assignmentPlayerName = characterToPlayer[characterName] ?? "";
        assignmentError = "";
        if (!assignmentModal?.open) {
            assignmentModal?.showModal();
        }
    }

    function clearAssignmentDialogState() {
        assignmentError = "";
        savingAssignment = false;
        assignmentCharacterName = null;
        assignmentPlayerName = "";
    }

    async function saveAssignment(event: SubmitEvent) {
        event.preventDefault();

        if (!assignmentCharacterName) {
            assignmentError = "No character selected.";
            return;
        }

        const playerName = assignmentPlayerName.trim();
        if (!playerName) {
            assignmentError = "Enter a player name to assign.";
            return;
        }

        savingAssignment = true;
        assignmentError = "";

        try {
            await updatePlayerAssignment(assignmentCharacterName, playerName);
            assignmentModal?.close();
        } catch (error) {
            assignmentError =
                error instanceof Error
                    ? error.message
                    : "Failed to update player assignment.";
        } finally {
            savingAssignment = false;
        }
    }

    async function clearAssignment(event: MouseEvent) {
        event.preventDefault();

        if (!assignmentCharacterName) {
            assignmentError = "No character selected.";
            return;
        }

        savingAssignment = true;
        assignmentError = "";

        try {
            await updatePlayerAssignment(assignmentCharacterName, "");
            assignmentPlayerName = "";
            assignmentModal?.close();
        } catch (error) {
            assignmentError =
                error instanceof Error
                    ? error.message
                    : "Failed to remove player assignment.";
        } finally {
            savingAssignment = false;
        }
    }

    function startPolling() {
        stopPolling();
        pollStartTime = Date.now();
        remainingSeconds = Math.ceil(POLL_DURATION / 1000);
        isPolling = true;
        pollLobby();
        pollInterval = setInterval(() => {
            const elapsed = Date.now() - (pollStartTime || 0);
            if (elapsed >= POLL_DURATION) {
                stopPolling();
                return;
            }
            pollLobby();
        }, POLL_INTERVAL);

        countdownInterval = setInterval(() => {
            const elapsed = Date.now() - (pollStartTime || 0);
            remainingSeconds = Math.max(
                0,
                Math.ceil((POLL_DURATION - elapsed) / 1000)
            );
            if (remainingSeconds <= 0) {
                stopPolling();
            }
        }, 1000);
    }

    async function updatePlayerAssignment(
        characterName: string,
        playerName: string
    ) {
        const response = await fetch(`/api/lobby/${lobbyCode}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                characterName,
                playerName,
            }),
        });

        if (!response.ok) {
            const data = await response.json().catch(() => null);
            throw new Error(
                data?.message || "Failed to update player assignment"
            );
        }

        const data = await response.json();
        syncAssignments(data.characterToPlayer || {});
        startPolling();
    }

    function syncAssignments(newCharToPlayer: Record<string, string>) {
        characterToPlayer = newCharToPlayer;

        if (nodes.length === 0 || nodes.length !== Object.keys(newCharToPlayer).length) {
            nodes = createNodesFromCharacters(newCharToPlayer);
            return;
        }

        nodes = nodes.map((node) => {
            const data = node.data as TokenData;
            const playerName = newCharToPlayer[data.character.name] || undefined;
            return {
                ...node,
                data: {
                    ...data,
                    playerName,
                    availableHelperTokens,
                    openAssignmentDialog,
                } satisfies TokenData,
            };
        });
    }

    // Create nodes in circle layout from characterToPlayer mapping
    function createNodesFromCharacters(
        charToPlayer: Record<string, string>
    ): Node[] {
        const centerX = 300;
        const centerY = 300;
        const radius = 250;

        const characters: Character[] = [];
        for (const characterName of Object.keys(charToPlayer)) {
            const character = findCharacterByName(characterName);
            if (character) {
                characters.push(character);
            }
        }

        return characters.map((character, i) => {
            const angle = (2 * Math.PI * i) / characters.length - Math.PI / 2;
            const id = `token-${i}`;
            const playerName = charToPlayer[character.name] || undefined;
            return {
                id,
                type: "characterToken",
                position: {
                    x: centerX + radius * Math.cos(angle),
                    y: centerY + radius * Math.sin(angle),
                },
                data: {
                    character,
                    playerName,
                    availableHelperTokens,
                    openAssignmentDialog,
                } satisfies TokenData,
            };
        });
    }

    async function pollLobby() {
        try {
            const response = await fetch(`/api/lobby/${lobbyCode}`);
            if (response.status === 404) {
                lobbyNotFound = true;
                stopPolling();
                return;
            }
            if (!response.ok) {
                console.error("Failed to fetch lobby");
                return;
            }

            const data = await response.json();
            const newCharToPlayer = data.characterToPlayer || {};
            syncAssignments(newCharToPlayer);

            // Stop polling if all characters have been assigned
            const allAssigned = Object.values(newCharToPlayer).every(
                (player) => player
            );
            if (allAssigned && Object.keys(newCharToPlayer).length > 0) {
                stopPolling();
            }
        } catch (error) {
            console.error("Error polling lobby:", error);
        }
    }

    const nodeTypes = {
        characterToken: CharacterTokenNode,
    };

    let nodes = $state<Node[]>([]);
    let edges = $state<Edge[]>([]);

    onMount(() => {
        startPolling();
    });

    onDestroy(() => {
        stopPolling();
    });
</script>

{#if lobbyNotFound}
    <div class="h-full w-full flex items-center justify-center">
        <div class="card bg-base-200 shadow-lg max-w-xs border border-base-300">
            <div class="card-body text-center">
                <h2 class="card-title justify-center">Game Not Found</h2>
                <p class="text-base-content/70">
                    The game code <span class="font-mono text-warning">{lobbyCode}</span> doesn't exist or has expired.
                </p>
                <div class="card-actions justify-center mt-4">
                    <a href="/storyteller" class="btn btn-primary">
                        Return to Lobby
                    </a>
                </div>
            </div>
        </div>
    </div>
{:else}
    <div class="h-full w-full relative">
        <SvelteFlow
            bind:nodes
            bind:edges
            {nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            proOptions={{ hideAttribution: true }}
        >
            <Background variant={BackgroundVariant.Dots} gap={20} />
        </SvelteFlow>
    </div>
{/if}

<dialog class="modal" bind:this={assignmentModal} onclose={clearAssignmentDialogState}>
    <div class="modal-box max-w-xs">
        <form method="dialog">
            <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
                ✕
            </button>
        </form>
        <h3 class="text-lg font-bold">
            {#if assignmentCharacterName}
                Assign player to {assignmentCharacterName}
            {:else}
                Assign player
            {/if}
        </h3>
        <form class="mt-4 flex flex-col gap-2" onsubmit={saveAssignment}>
            <label class="input input-sm input-bordered flex items-center gap-2">
                <input
                    class="grow text-sm"
                    type="text"
                    bind:value={assignmentPlayerName}
                    list={assignmentKnownPlayers.length > 0
                        ? assignmentOptionsId
                        : undefined}
                    placeholder="Player name"
                />
            </label>

            {#if assignmentKnownPlayers.length > 0}
                <datalist id={assignmentOptionsId}>
                    {#each assignmentKnownPlayers as knownPlayer}
                        <option value={knownPlayer}></option>
                    {/each}
                </datalist>
            {/if}

            <div class="flex items-center gap-2">
                <button
                    type="submit"
                    class="btn btn-primary btn-sm flex-1"
                    disabled={savingAssignment}
                >
                    <Save size={12} />
                    <span>{savingAssignment ? "Saving..." : "Save"}</span>
                </button>

                {#if assignmentCharacterName && characterToPlayer[assignmentCharacterName]}
                    <button
                        type="button"
                        class="btn btn-error btn-outline btn-sm"
                        disabled={savingAssignment}
                        onclick={clearAssignment}
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

<style>
    :global(.svelte-flow) {
        --xy-background-color: var(--color-base-100);
    }
</style>
