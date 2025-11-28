<script lang="ts">
    import LobbyCreateForm from "$lib/components/lobby-create-form.svelte";
    import CharacterSelect from "$lib/components/character-select.svelte";
    import { setSelectedCharacters } from "$lib/stores/lobby.svelte";
    import { goto } from "$app/navigation";

    let playerCount = $state(5);

    let progress: "select-script" | "select-characters" =
        $state("select-script");

    function handleSubmit(e: Event) {
        e.preventDefault();
        progress = "select-characters";
    }

    async function onSelect(characterIds: string[]) {
        // Store selected characters
        setSelectedCharacters(characterIds);

        // Create characterToPlayer mapping (initially empty strings)
        const characterToPlayer: Record<string, string> = {};
        for (const characterId of characterIds) {
            characterToPlayer[characterId] = "";
        }

        // Create lobby
        const response = await fetch("/api/lobby", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                playerCount,
                characterToPlayer,
            }),
        });

        if (!response.ok) {
            console.error("Failed to create lobby");
            return;
        }

        const { code } = await response.json();
        
        // Navigate to grimoire with lobby code
        goto(`/storyteller/grimoire?code=${code}`);
    }
</script>

{#if progress === "select-script"}
    <div class="flex justify-center items-center h-screen">
        <LobbyCreateForm bind:playerCount {handleSubmit} />
    </div>
{:else if progress === "select-characters"}
    <CharacterSelect {playerCount} {onSelect} />
{:else}
    <div class="flex justify-center items-center h-screen">
        <p>Unknown state</p>
    </div>
{/if}
