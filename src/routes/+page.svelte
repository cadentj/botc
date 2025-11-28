<script lang="ts">
    import PlayerJoinForm from "$lib/components/player-join-form.svelte";
    import { page } from "$app/stores";

    const prefillCode = $derived($page.url.searchParams.get("code")?.toUpperCase() ?? "");

    let name = $state("");
    let lobbyCode = $state("");

    // Sync with prefillCode when it changes
    $effect(() => {
        if (prefillCode) lobbyCode = prefillCode;
    });

    const formAction = $derived(lobbyCode.length === 4 ? `/player/${lobbyCode.toUpperCase()}` : "");
</script>

<div class="flex justify-center items-center h-screen">
    <PlayerJoinForm bind:name bind:lobbyCode action={formAction} codeProvided={!!prefillCode} />
</div>