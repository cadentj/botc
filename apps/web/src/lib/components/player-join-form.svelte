<script lang="ts">
    let {
        name = $bindable(),
        lobbyCode = $bindable(),
        handleSubmit,
    }: { name: string; lobbyCode: string; handleSubmit: (e: Event) => void } =
        $props();
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
            oninput={(e) => (name = e.currentTarget.value)}
        />

        <label class="label" for="lobby-code-input">Lobby Code</label>
        <input
            id="lobby-code-input"
            type="text"
            class="input"
            placeholder="Lobby Code"
            oninput={(e) => (lobbyCode = e.currentTarget.value)}
        />

        <button class="btn btn-neutral mt-4">Join</button>
        <div class="divider my-1.5">Or</div>
        <button class="btn btn-neutral">Create game as a storyteller</button>
    </fieldset>
</form>