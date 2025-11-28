<script lang="ts">
    import { CHARACTERS_BY_TYPE } from "$lib/botc-data/trouble-brewing";
    import CHARACTER_COUNTS from "$lib/botc-data/const";
    import type { CharacterType } from "$lib/types/characters";

    let {
        playerCount,
        onSelect,
    }: {
        playerCount: number;
        onSelect: (characterNames: string[]) => void;
    } = $props();

    let selectedCharacters = $state(new Set<string>());

    const selectedCount = $derived(selectedCharacters.size);
    const isValid = $derived(selectedCount === playerCount);
    const isFull = $derived(selectedCount >= playerCount);

    const baseComposition = $derived(CHARACTER_COUNTS[playerCount]);

    // Adjust for Baron (+2 outsiders, -2 townsfolk)
    const targetComposition = $derived({
        townsfolk: baseComposition.townsfolk - (selectedCharacters.has("Baron") ? 2 : 0),
        outsiders: baseComposition.outsiders + (selectedCharacters.has("Baron") ? 2 : 0),
        minions: baseComposition.minions,
        demons: baseComposition.demons,
    });

    const currentCounts = $derived({
        townsfolk: [...selectedCharacters].filter((name) => CHARACTERS_BY_TYPE.townsfolk.find((c) => c.name === name)).length,
        outsiders: [...selectedCharacters].filter((name) => CHARACTERS_BY_TYPE.outsiders.find((c) => c.name === name)).length,
        minions: [...selectedCharacters].filter((name) => CHARACTERS_BY_TYPE.minions.find((c) => c.name === name)).length,
        demons: [...selectedCharacters].filter((name) => CHARACTERS_BY_TYPE.demons.find((c) => c.name === name)).length,
    });

    function toggleCharacter(name: string) {
        if (selectedCharacters.has(name)) {
            selectedCharacters.delete(name);
            selectedCharacters = new Set(selectedCharacters);
        } else {
            selectedCharacters.add(name);
            selectedCharacters = new Set(selectedCharacters);
        }
    }

    function handleConfirm() {
        if (isValid) {
            onSelect([...selectedCharacters]);
        }
    }

    const typeBorderColors: Record<CharacterType, string> = {
        townsfolk: "border-l-info",
        outsiders: "border-l-accent",
        minions: "border-l-warning",
        demons: "border-l-error",
    };
</script>

<div class="max-w-5xl mx-auto flex flex-col gap-6 p-4 pb-24">
    <header class="text-center">
        <h1 class="text-3xl font-bold mb-2">Select Characters</h1>
        <p class="text-base-content/70 mb-2">
            Choose characters for {playerCount} players
        </p>
        <div class="flex justify-center gap-2 flex-wrap text-sm text-base-content/70">
            <span class="badge badge-soft" class:badge-primary={currentCounts.townsfolk === targetComposition.townsfolk}>
                Townsfolk: {currentCounts.townsfolk}/{targetComposition.townsfolk}
            </span>
            <span class="badge badge-soft" class:badge-accent={currentCounts.outsiders === targetComposition.outsiders}>
                Outsiders: {currentCounts.outsiders}/{targetComposition.outsiders}
            </span>
            <span class="badge badge-soft" class:badge-warning={currentCounts.minions === targetComposition.minions}>
                Minions: {currentCounts.minions}/{targetComposition.minions}
            </span>
            <span class="badge badge-soft" class:badge-error={currentCounts.demons === targetComposition.demons}>
                Demons: {currentCounts.demons}/{targetComposition.demons}
            </span>
        </div>
    </header>

    <div class="flex flex-col gap-8">
        {#each ["townsfolk", "outsiders", "minions", "demons"] as type}
            {@const charType = type as CharacterType}
            <section class="flex flex-col gap-3">
                <h2 class="text-lg font-semibold p-2 rounded bg-base-200 border-l-4 {typeBorderColors[charType]}">
                    {charType.charAt(0).toUpperCase() + charType.slice(1)}
                </h2>
                <div class="grid grid-cols-3 gap-3">
                    {#each CHARACTERS_BY_TYPE[charType] as char}
                        {@const isSelected = selectedCharacters.has(char.name)}
                        {@const isDisabled = !isSelected && isFull}
                        <button
                            type="button"
                            class="card bg-base-200 hover:bg-base-300 cursor-pointer transition-all p-3 text-left border-2"
                            class:border-primary={isSelected}
                            class:border-transparent={!isSelected}
                            class:opacity-50={isDisabled}
                            class:cursor-not-allowed={isDisabled}
                            disabled={isDisabled}
                            onclick={() => toggleCharacter(char.name)}
                        >
                            <h3 class="font-medium text-sm">{char.name}</h3>
                            <p class="text-xs text-base-content/60 mt-1 line-clamp-2">
                                {char.ability}
                            </p>
                        </button>
                    {/each}
                </div>
            </section>
        {/each}
    </div>

    <footer class="fixed bottom-0 left-0 right-0 py-4 bg-base-100 border-t border-base-300 flex justify-center">
        <button
            type="button"
            class="btn btn-primary btn-wide"
            disabled={!isValid}
            onclick={handleConfirm}
        >
            {#if isValid}
                Confirm Selection
            {:else}
                Complete your selection
            {/if}
        </button>
    </footer>
</div>
