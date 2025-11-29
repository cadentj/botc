import type { Character, CharacterType, HelperToken } from "$lib/types/characters";
import {
    Shirt,
    BookOpen,
    Search,
    ChefHat,
    Heart,
    Sparkles,
    Skull,
    Shield,
    Bird,
    Flower2,
    Crosshair,
    Swords,
    Crown,
    Wine,
    Beer,
    Ghost,
    Cross,
    FlaskConical,
    Eye,
    Castle,
    HeartCrack,
    Flame,
} from '@lucide/svelte';

export const TOWNSFOLK: Character[] = [
    { name: "Washerwoman", type: "townsfolk", ability: "You start knowing that 1 of 2 players is a particular Townsfolk.", icon: Shirt, firstNightOrder: 5 },
    { name: "Librarian", type: "townsfolk", ability: "You start knowing that 1 of 2 players is a particular Outsider. (Or that zero are in play.)", icon: BookOpen, firstNightOrder: 6 },
    { name: "Investigator", type: "townsfolk", ability: "You start knowing that 1 of 2 players is a particular Minion.", icon: Search, firstNightOrder: 7 },
    { name: "Chef", type: "townsfolk", ability: "You start knowing how many pairs of evil players there are.", icon: ChefHat, firstNightOrder: 8 },
    { name: "Empath", type: "townsfolk", ability: "Each night, you learn how many of your 2 alive neighbours are evil.", icon: Heart, firstNightOrder: 9, otherNightOrder: 8 },
    { name: "Fortune Teller", type: "townsfolk", ability: "Each night, choose 2 players: you learn if either is a Demon. There is a good player that registers as a Demon to you.", icon: Sparkles, firstNightOrder: 10, otherNightOrder: 9 },
    { name: "Undertaker", type: "townsfolk", ability: "Each night*, you learn which character died by execution today.", icon: Skull, otherNightOrder: 7 },
    { name: "Monk", type: "townsfolk", ability: "Each night*, choose a player (not yourself): they are safe from the Demon tonight.", icon: Shield, otherNightOrder: 2 },
    { name: "Ravenkeeper", type: "townsfolk", ability: "If you die at night, you are woken to choose a player: you learn their character.", icon: Bird, otherNightOrder: 6 },
    { name: "Virgin", type: "townsfolk", ability: "The 1st time you are nominated, if the nominator is a Townsfolk, they are executed immediately.", icon: Flower2 },
    { name: "Slayer", type: "townsfolk", ability: "Once per game, during the day, publicly choose a player: if they are the Demon, they die.", icon: Crosshair },
    { name: "Soldier", type: "townsfolk", ability: "You are safe from the Demon.", icon: Swords },
    { name: "Mayor", type: "townsfolk", ability: "If only 3 players live & no execution occurs, your team wins. If you die at night, another player might die instead.", icon: Crown },
];

export const OUTSIDERS: Character[] = [
    { name: "Butler", type: "outsiders", ability: "Each night, choose a player (not yourself): tomorrow, you may only vote if they are voting too.", icon: Wine, firstNightOrder: 11, otherNightOrder: 10 },
    { name: "Drunk", type: "outsiders", ability: "You do not know you are the Drunk. You think you are a Townsfolk character, but you are not.", icon: Beer },
    { name: "Recluse", type: "outsiders", ability: "You might register as evil & as a Minion or Demon, even if dead.", icon: Ghost },
    { name: "Saint", type: "outsiders", ability: "If you die by execution, your team loses.", icon: Cross },
];

export const MINIONS: Character[] = [
    { name: "Poisoner", type: "minions", ability: "Each night, choose a player: they are poisoned tonight and tomorrow day.", icon: FlaskConical, firstNightOrder: 3, otherNightOrder: 1 },
    { name: "Spy", type: "minions", ability: "Each night, you see the Grimoire. You might register as good & as a Townsfolk or Outsider, even if dead.", icon: Eye, firstNightOrder: 4, otherNightOrder: 3 },
    { name: "Baron", type: "minions", ability: "There are extra Outsiders in play. [+2 Outsiders]", icon: Castle },
    { name: "Scarlet Woman", type: "minions", ability: "If there are 5 or more players alive (Travellers don't count) & the Demon dies, you become the Demon.", icon: HeartCrack, otherNightOrder: 4 },
];

export const DEMONS: Character[] = [
    { name: "Imp", type: "demons", ability: "Each night*, choose a player: they die. If you kill yourself this way, a Minion becomes the Imp.", icon: Flame, otherNightOrder: 5 },
];

export const CHARACTERS_BY_TYPE: Record<CharacterType, Character[]> = {
    townsfolk: TOWNSFOLK,
    outsiders: OUTSIDERS,
    minions: MINIONS,
    demons: DEMONS,
};

export const HELPER_TOKENS: HelperToken[] = [
    // Washerwoman tokens
    { id: "washerwoman-townsfolk", name: "Townsfolk", forCharacter: "Washerwoman" },
    { id: "washerwoman-wrong", name: "Wrong", forCharacter: "Washerwoman" },
    
    // Librarian tokens
    { id: "librarian-outsider", name: "Outsider", forCharacter: "Librarian" },
    { id: "librarian-wrong", name: "Wrong", forCharacter: "Librarian" },
    
    // Investigator tokens
    { id: "investigator-minion", name: "Minion", forCharacter: "Investigator" },
    { id: "investigator-wrong", name: "Wrong", forCharacter: "Investigator" },
    
    // Chef tokens
    { id: "chef-seen", name: "Seen", forCharacter: "Chef" },
    
    // Empath tokens
    { id: "empath-seen", name: "Seen", forCharacter: "Empath" },
    
    // Fortune Teller tokens
    { id: "fortune-teller-red-herring", name: "Red herring", forCharacter: "Fortune Teller" },
    
    // Monk tokens
    { id: "monk-protected", name: "Protected", forCharacter: "Monk" },
    
    // Poisoner tokens
    { id: "poisoner-poisoned", name: "Poisoned", forCharacter: "Poisoner" },
    
    // Spy tokens
    { id: "spy-seen", name: "Seen", forCharacter: "Spy" },
    
    // Scarlet Woman tokens
    { id: "scarlet-woman-is-demon", name: "Is the Demon", forCharacter: "Scarlet Woman" },
    
    // Imp tokens
    { id: "imp-dead", name: "Dead", forCharacter: "Imp" },
    
    // Drunk token (always available)
    { id: "drunk-is-the-drunk", name: "Is the Drunk", forCharacter: "Drunk", alwaysAvailable: true },
];

