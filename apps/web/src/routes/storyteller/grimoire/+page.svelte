<script lang="ts">
    import { SvelteFlow, Background, BackgroundVariant } from "@xyflow/svelte";

    let nodes = $state.raw([]);
    let edges = $state.raw([]);
</script>

<SvelteFlow bind:nodes bind:edges>
    <Background bgColor="#ccc" variant={BackgroundVariant.Dots} />
</SvelteFlow>
