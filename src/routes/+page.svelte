<script lang="ts">
    import PlayerJoinForm from "$lib/components/player-join-form.svelte";
    import { page } from "$app/stores";
    import { onMount } from "svelte";

    const PLAYER_NAME_KEY = "botc-player-name";

    const prefillCode = $page.url.searchParams.get("code")?.toUpperCase() ?? "";

    let name = $state("");
    let lobbyCode = $state(prefillCode);

    onMount(() => {
        const storedName = localStorage.getItem(PLAYER_NAME_KEY);
        if (storedName) {
            name = storedName;
        }
    });
</script>

<div class="flex justify-center items-center h-screen">
    <PlayerJoinForm bind:name bind:lobbyCode codeProvided={!!prefillCode} />
</div>
