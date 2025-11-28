<script lang="ts">
    import CHARACTER_COUNTS from "$lib/botc-data/const";

    let { playerCount }: { playerCount: number } = $props();
</script>

<div class="overflow-x-auto">
    <table class="table table-sm">
        <thead>
            <tr>
                <th>Players</th>
                {#each Object.keys(CHARACTER_COUNTS) as count}
                    <th class={Number(count) === playerCount ? "bg-primary/20" : ""}>{count}</th>
                {/each}
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Townsfolk</td>
                {#each Object.entries(CHARACTER_COUNTS) as [count, dist]}
                    <td class={Number(count) === playerCount ? "bg-primary/20" : ""}>{dist.townsfolk}</td>
                {/each}
            </tr>
            <tr>
                <td>Outsiders</td>
                {#each Object.entries(CHARACTER_COUNTS) as [count, dist]}
                    <td class={Number(count) === playerCount ? "bg-primary/20" : ""}>{dist.outsiders}</td>
                {/each}
            </tr>
            <tr>
                <td>Minions</td>
                {#each Object.entries(CHARACTER_COUNTS) as [count, dist]}
                    <td class={Number(count) === playerCount ? "bg-primary/20" : ""}>{dist.minions}</td>
                {/each}
            </tr>
            <tr>
                <td>Demons</td>
                {#each Object.entries(CHARACTER_COUNTS) as [count, dist]}
                    <td class={Number(count) === playerCount ? "bg-primary/20" : ""}>{dist.demons}</td>
                {/each}
            </tr>
        </tbody>
    </table>
</div>

