import type { CharacterDistribution } from "$lib/types/game";
import type { Character, CharacterType } from "$lib/types/characters";

export abstract class Script {
    // Abstract properties - subclasses must define these
    abstract townsfolk: Character[]
    abstract outsiders: Character[]
    abstract minions: Character[]
    abstract demons: Character[]

    // Abstract methods - subclasses must implement these
    abstract getCharacterDistribution(numberOfPlayers: number, selectedCharacters: string[]): CharacterDistribution;

    getCharactersByType(): Record<CharacterType, Character[]> {
        return {
            townsfolk: this.townsfolk,
            outsiders: this.outsiders,
            minions: this.minions,
            demons: this.demons,
        }
    }
}