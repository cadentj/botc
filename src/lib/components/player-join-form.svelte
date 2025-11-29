<script lang="ts">
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";

    const PLAYER_NAME_KEY = "botc-player-name";

    let {
        name = $bindable(),
        lobbyCode = $bindable(),
        codeProvided = false,
    }: { name: string; lobbyCode: string; codeProvided?: boolean } = $props();

    const isCodeValid = $derived(lobbyCode.length === 4);

    onMount(() => {
        const storedName = localStorage.getItem(PLAYER_NAME_KEY);
        if (storedName) {
            name = storedName;
        }
    });

    function handleSubmit() {
        localStorage.setItem(PLAYER_NAME_KEY, name.trim());
        goto(`/player/${lobbyCode.toUpperCase()}`);
    }
</script>

<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
    <fieldset
        class="fieldset bg-base-200 border-base-300 rounded-box w-xs border p-4"
    >
        <legend class="fieldset-legend">Join a Game</legend>

        <label class="label" for="name-input">Name</label>
        <input
            id="name-input"
            type="text"
            name="playerName"
            class="input"
            placeholder="Name"
            bind:value={name}
        />

        {#if !codeProvided}
            <label class="label" for="lobby-code-input">Lobby Code</label>
            <input
                id="lobby-code-input"
                type="text"
                class="input"
                placeholder="Lobby Code"
                bind:value={lobbyCode}
            />
        {/if}

        <button class="btn btn-neutral mt-4" disabled={!name || !isCodeValid}>
            Join
        </button>

        {#if !codeProvided}
            <div class="divider my-1.5">Or</div>
            <a href="/storyteller" class="btn btn-neutral">Create game as a storyteller</a>
        {/if}
    </fieldset>
</form>
