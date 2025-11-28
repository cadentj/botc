<script lang="ts">
    let {
        playerCount = $bindable(),
        handleSubmit,
    }: { playerCount: number; handleSubmit: (e: Event) => void } = $props();
</script>

<form onsubmit={handleSubmit}>
    <fieldset
        class="fieldset bg-base-200 border-base-300 rounded-box w-xs border p-4"
    >
        <legend class="fieldset-legend">Create a Game</legend>

        <label class="label" for="player-count-input">Player Count</label>
        <input
            id="player-count-input"
            type="number"
            class="input"
            required
            bind:value={playerCount}
            min="5"
            max="15"
        />

        <label class="label" for="script-select">Script</label>
        <select id="script-select" class="select">
            <option disabled>Pick a script</option>
            <option selected>Trouble Brewing</option>
        </select>

        <button class="btn btn-neutral mt-4">Create</button>
        <div class="divider my-1.5">Or</div>
        <a href="/" class="btn btn-neutral">Go back</a>
    </fieldset>
</form>
