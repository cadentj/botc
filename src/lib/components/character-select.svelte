<script lang="ts">
    import { Info } from "@lucide/svelte";
    import { CHARACTERS_BY_TYPE } from "$lib/botc-data/trouble-brewing.svelte";
    import CHARACTER_COUNTS from "$lib/botc-data/const";
    import CharacterDistributionTable from "./character-distribution-table.svelte";
    import type { CharacterType } from "$lib/types/characters";

    let {
        playerCount,
        onSelect,
    }: {
        playerCount: number;
        onSelect: (characterNames: string[]) => void;
    } = $props();

    let selectedCharacters = $state(new Set<string>());
    let modal: HTMLDialogElement;

    const selectedCount = $derived(selectedCharacters.size);
    const isValid = $derived(selectedCount === playerCount);
    const isFull = $derived(selectedCount >= playerCount);

    const baseComposition = $derived(CHARACTER_COUNTS[playerCount]);

    // Adjust for Baron (+2 outsiders, -2 townsfolk)
    const targetComposition = $derived({
        townsfolk:
            baseComposition.townsfolk -
            (selectedCharacters.has("Baron") ? 2 : 0),
        outsiders:
            baseComposition.outsiders +
            (selectedCharacters.has("Baron") ? 2 : 0),
        minions: baseComposition.minions,
        demons: baseComposition.demons,
    });

    const currentCounts = $derived({
        townsfolk: [...selectedCharacters].filter((name) =>
            CHARACTERS_BY_TYPE.townsfolk.find((c) => c.name === name)
        ).length,
        outsiders: [...selectedCharacters].filter((name) =>
            CHARACTERS_BY_TYPE.outsiders.find((c) => c.name === name)
        ).length,
        minions: [...selectedCharacters].filter((name) =>
            CHARACTERS_BY_TYPE.minions.find((c) => c.name === name)
        ).length,
        demons: [...selectedCharacters].filter((name) =>
            CHARACTERS_BY_TYPE.demons.find((c) => c.name === name)
        ).length,
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
    <div class="flex flex-col gap-8">
        {#each ["townsfolk", "outsiders", "minions", "demons"] as type}
            {@const charType = type as CharacterType}
            <section class="flex flex-col gap-3">
                <div class="divider">
                    {charType.charAt(0).toUpperCase() + charType.slice(1)}
                </div>
                <div
                    class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3"
                >
                    {#each CHARACTERS_BY_TYPE[charType] as char}
                        {@const isSelected = selectedCharacters.has(char.name)}
                        {@const isDisabled = !isSelected && isFull}
                        <button
                            type="button"
                            class="card flex flex-row gap-3 bg-base-200 hover:bg-base-300 cursor-pointer transition-all p-3 text-left border-2"
                            class:border-primary={isSelected}
                            class:border-transparent={!isSelected}
                            class:opacity-50={isDisabled}
                            class:cursor-not-allowed={isDisabled}
                            disabled={isDisabled}
                            onclick={() => toggleCharacter(char.name)}
                        >
                            <char.icon size={16} class="min-w-5 h-5" />
                            <div class="flex flex-col">
                                <h3 class="font-medium text-sm">{char.name}</h3>
                                <p
                                    class="text-xs text-base-content/60 mt-1 line-clamp-3"
                                >
                                    {char.ability}
                                </p>
                            </div>
                        </button>
                    {/each}
                </div>
            </section>
        {/each}
    </div>

    <footer
        class="fixed bottom-0 left-0 right-0 py-3 px-4 bg-base-100 border-t border-base-300 flex items-center justify-center gap-4"
    >
        <button
            type="button"
            class="btn btn-primary"
            disabled={!isValid}
            onclick={handleConfirm}
        >
            {#if isValid}
                Confirm Selection
            {:else}
                Complete your selection
            {/if}
        </button>

        <button class="btn btn-square" onclick={() => modal.showModal()}>
            <Info size={16} />
        </button>

        <div
            class="bg-base-300 p-3 rounded grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-base-content/70"
        >
            <span
                class={currentCounts.townsfolk === targetComposition.townsfolk
                    ? "text-primary"
                    : ""}
            >
                Townsfolk: {currentCounts.townsfolk}/{targetComposition.townsfolk}
            </span>
            <span
                class={currentCounts.outsiders === targetComposition.outsiders
                    ? "text-accent"
                    : ""}
            >
                Outsiders: {currentCounts.outsiders}/{targetComposition.outsiders}
            </span>
            <span
                class={currentCounts.minions === targetComposition.minions
                    ? "text-warning"
                    : ""}
            >
                Minions: {currentCounts.minions}/{targetComposition.minions}
            </span>
            <span
                class={currentCounts.demons === targetComposition.demons
                    ? "text-error"
                    : ""}
            >
                Demons: {currentCounts.demons}/{targetComposition.demons}
            </span>
        </div>
    </footer>

    <dialog class="modal" bind:this={modal}>
        <div class="modal-box">
            <form method="dialog">
                <button
                    class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                    >✕</button
                >
            </form>
            <h3 class="text-lg font-bold">Character Selection Info</h3>

            <p class="py-4">
                Select a set of character tokens for the game. To include a
                drunk outsider, just choose a townsfolk token as normal and set
                the drunk token within the grimoire.
            </p>

            <CharacterDistributionTable {playerCount} />
        </div>
        <form method="dialog" class="modal-backdrop">
            <button>close</button>
        </form>
    </dialog>
</div>
