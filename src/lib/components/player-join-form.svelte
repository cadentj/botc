<script lang="ts">
    let {
        name = $bindable(),
        lobbyCode = $bindable(),
        handleSubmit,
        isJoining = false,
    }: { name: string; lobbyCode: string; handleSubmit: (e: Event) => void; isJoining?: boolean } =
        $props();

    const isCodeValid = $derived(lobbyCode.length === 4);
</script>

<form onsubmit={handleSubmit}>
    <fieldset
        class="fieldset bg-base-200 border-base-300 rounded-box w-xs border p-4"
    >
        <legend class="fieldset-legend">Join a Game</legend>

        <label class="label" for="name-input">Name</label>
        <input
            id="name-input"
            type="text"
            class="input"
            placeholder="Name"
            bind:value={name}
        />

        <label class="label" for="lobby-code-input">Lobby Code</label>
        <input
            id="lobby-code-input"
            type="text"
            class="input"
            placeholder="Lobby Code"
            bind:value={lobbyCode}
        />

        <button class="btn btn-neutral mt-4" disabled={!name || !isCodeValid || isJoining}>
            {#if isJoining}
                <span class="loading loading-spinner loading-sm"></span>
                Joining...
            {:else}
                Join
            {/if}
        </button>
        <div class="divider my-1.5">Or</div>
        <a href="/storyteller" class="btn btn-neutral">Create game as a storyteller</a>
    </fieldset>
</form>