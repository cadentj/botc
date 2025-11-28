<script lang="ts">
    import PlayerJoinForm from "$lib/components/player-join-form.svelte";
    import { goto } from "$app/navigation";
    import { setAssignedRole } from "$lib/stores/player.svelte";

    let name = $state("");
    let lobbyCode = $state("");
    let isJoining = $state(false);
    let error = $state<string | null>(null);

    async function handleSubmit(e: Event) {
        e.preventDefault();
        if (!name.trim() || lobbyCode.length !== 4) return;

        isJoining = true;
        error = null;

        try {
            const response = await fetch(`/api/lobby/${lobbyCode.toUpperCase()}/join`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ playerName: name.trim() }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: "Failed to join lobby" }));
                error = errorData.message || "Failed to join lobby";
                isJoining = false;
                return;
            }

            const data = await response.json();
            setAssignedRole({
                name: data.name,
                type: data.type,
                ability: data.ability,
            });

            goto(`/player/${lobbyCode.toUpperCase()}`);
        } catch (err) {
            error = "Network error. Please try again.";
            isJoining = false;
        }
    }
</script>

<div class="flex justify-center items-center h-screen">
    <div class="flex flex-col gap-4">
        {#if error}
            <div class="alert alert-error">
                <span>{error}</span>
            </div>
        {/if}
        <PlayerJoinForm bind:name bind:lobbyCode {handleSubmit} {isJoining} />
    </div>
</div>