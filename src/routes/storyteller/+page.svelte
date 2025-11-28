<script lang="ts">
    import LobbyCreateForm from "$lib/components/lobby-create-form.svelte";
    import CharacterSelect from "$lib/components/character-select.svelte";

    let playerCount = $state(5);

    let progress: "select-script" | "select-characters" =
        $state("select-script");

    function handleSubmit(e: Event) {
        e.preventDefault();
        progress = "select-characters";
    }

    function onSelect(characterIds: string[]) {
        console.log(characterIds);
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
