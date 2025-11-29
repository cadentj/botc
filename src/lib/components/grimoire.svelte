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
    const POLL_DURATION = 5 * 60 * 1000; // 5 minutes
    const POLL_INTERVAL = 10 * 1000; // 10 seconds

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
                } satisfies TokenData,
            };
        });
    }

    async function pollLobby() {
        try {
            const response = await fetch(`/api/lobby/${lobbyCode}`);
            if (!response.ok) {
                console.error("Failed to fetch lobby");
                return;
            }

            const data = await response.json();
            const newCharToPlayer = data.characterToPlayer || {};

            // If this is the first poll (no nodes yet), create the initial layout
            if (nodes.length === 0) {
                characterToPlayer = newCharToPlayer;
                nodes = createNodesFromCharacters(newCharToPlayer);
            } else {
                // Update existing nodes with player names
                characterToPlayer = newCharToPlayer;
                nodes = nodes.map((node) => {
                    const data = node.data as TokenData;
                    const playerName =
                        newCharToPlayer[data.character.name] || undefined;
                    return {
                        ...node,
                        data: {
                            ...data,
                            playerName,
                            availableHelperTokens,
                        } satisfies TokenData,
                    };
                });
            }

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
        // Start polling - first poll will create the nodes
        pollStartTime = Date.now();
        pollLobby();
        pollInterval = setInterval(() => {
            const elapsed = Date.now() - (pollStartTime || 0);
            if (elapsed >= POLL_DURATION) {
                stopPolling();
                return;
            }
            pollLobby();
        }, POLL_INTERVAL);

        // Start countdown timer
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
    });

    onDestroy(() => {
        stopPolling();
    });
</script>

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

<style>
    :global(.svelte-flow) {
        --xy-background-color: var(--color-base-100);
    }
</style>
