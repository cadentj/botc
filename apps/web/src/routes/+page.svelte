<script lang="ts">
    import PlayerJoinForm from "$lib/components/player-join-form.svelte";

    let name = $state("");
    let lobbyCode = $state("");

    function handleSubmit(e: Event) {
        console.log(name, lobbyCode);
    }
</script>

<div class="flex justify-center items-center h-screen">
    <PlayerJoinForm bind:name bind:lobbyCode {handleSubmit} />
</div>