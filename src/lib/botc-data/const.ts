import type { CharacterDistribution } from "$lib/types/game";

const CHARACTER_COUNTS: Record<number, CharacterDistribution> = {
    5:  { townsfolk: 3, outsiders: 0, minions: 1, demons: 1 },
    6:  { townsfolk: 3, outsiders: 1, minions: 1, demons: 1 },
    7:  { townsfolk: 5, outsiders: 0, minions: 1, demons: 1 },
    8:  { townsfolk: 5, outsiders: 1, minions: 1, demons: 1 },
    9:  { townsfolk: 5, outsiders: 2, minions: 1, demons: 1 },
    10: { townsfolk: 7, outsiders: 0, minions: 2, demons: 1 },
    11: { townsfolk: 7, outsiders: 1, minions: 2, demons: 1 },
    12: { townsfolk: 7, outsiders: 2, minions: 2, demons: 1 },
    13: { townsfolk: 9, outsiders: 0, minions: 3, demons: 1 },
    14: { townsfolk: 9, outsiders: 1, minions: 3, demons: 1 },
    15: { townsfolk: 9, outsiders: 2, minions: 3, demons: 1 },
  };

export default CHARACTER_COUNTS;