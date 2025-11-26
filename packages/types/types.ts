// Character types
export type CharacterType = "townsfolk" | "outsider" | "minion" | "demon";

export interface Character {
  id: string;
  name: string;
  type: CharacterType;
  ability: string;
  icon: string; // Lucide icon name
  firstNightOrder?: number; // Order to wake on first night (undefined = doesn't wake)
  otherNightOrder?: number; // Order to wake on other nights (undefined = doesn't wake)
}

export const TROUBLE_BREWING: Character[] = [
  // Townsfolk (13)
  { id: "washerwoman", name: "Washerwoman", type: "townsfolk", ability: "You start knowing that 1 of 2 players is a particular Townsfolk.", icon: "Shirt", firstNightOrder: 5 },
  { id: "librarian", name: "Librarian", type: "townsfolk", ability: "You start knowing that 1 of 2 players is a particular Outsider. (Or that zero are in play.)", icon: "BookOpen", firstNightOrder: 6 },
  { id: "investigator", name: "Investigator", type: "townsfolk", ability: "You start knowing that 1 of 2 players is a particular Minion.", icon: "Search", firstNightOrder: 7 },
  { id: "chef", name: "Chef", type: "townsfolk", ability: "You start knowing how many pairs of evil players there are.", icon: "ChefHat", firstNightOrder: 8 },
  { id: "empath", name: "Empath", type: "townsfolk", ability: "Each night, you learn how many of your 2 alive neighbours are evil.", icon: "Heart", firstNightOrder: 9, otherNightOrder: 8 },
  { id: "fortune_teller", name: "Fortune Teller", type: "townsfolk", ability: "Each night, choose 2 players: you learn if either is a Demon. There is a good player that registers as a Demon to you.", icon: "Sparkles", firstNightOrder: 10, otherNightOrder: 9 },
  { id: "undertaker", name: "Undertaker", type: "townsfolk", ability: "Each night*, you learn which character died by execution today.", icon: "Skull", otherNightOrder: 7 },
  { id: "monk", name: "Monk", type: "townsfolk", ability: "Each night*, choose a player (not yourself): they are safe from the Demon tonight.", icon: "Shield", otherNightOrder: 2 },
  { id: "ravenkeeper", name: "Ravenkeeper", type: "townsfolk", ability: "If you die at night, you are woken to choose a player: you learn their character.", icon: "Bird", otherNightOrder: 6 },
  { id: "virgin", name: "Virgin", type: "townsfolk", ability: "The 1st time you are nominated, if the nominator is a Townsfolk, they are executed immediately.", icon: "Flower2" },
  { id: "slayer", name: "Slayer", type: "townsfolk", ability: "Once per game, during the day, publicly choose a player: if they are the Demon, they die.", icon: "Crosshair" },
  { id: "soldier", name: "Soldier", type: "townsfolk", ability: "You are safe from the Demon.", icon: "Swords" },
  { id: "mayor", name: "Mayor", type: "townsfolk", ability: "If only 3 players live & no execution occurs, your team wins. If you die at night, another player might die instead.", icon: "Crown" },

  // Outsiders (4)
  { id: "butler", name: "Butler", type: "outsider", ability: "Each night, choose a player (not yourself): tomorrow, you may only vote if they are voting too.", icon: "Wine", firstNightOrder: 11, otherNightOrder: 10 },
  { id: "drunk", name: "Drunk", type: "outsider", ability: "You do not know you are the Drunk. You think you are a Townsfolk character, but you are not.", icon: "Beer" },
  { id: "recluse", name: "Recluse", type: "outsider", ability: "You might register as evil & as a Minion or Demon, even if dead.", icon: "Ghost" },
  { id: "saint", name: "Saint", type: "outsider", ability: "If you die by execution, your team loses.", icon: "Cross" },

  // Minions (4)
  { id: "poisoner", name: "Poisoner", type: "minion", ability: "Each night, choose a player: they are poisoned tonight and tomorrow day.", icon: "FlaskConical", firstNightOrder: 3, otherNightOrder: 1 },
  { id: "spy", name: "Spy", type: "minion", ability: "Each night, you see the Grimoire. You might register as good & as a Townsfolk or Outsider, even if dead.", icon: "Eye", firstNightOrder: 4, otherNightOrder: 3 },
  { id: "baron", name: "Baron", type: "minion", ability: "There are extra Outsiders in play. [+2 Outsiders]", icon: "Castle" },
  { id: "scarlet_woman", name: "Scarlet Woman", type: "minion", ability: "If there are 5 or more players alive (Travellers don't count) & the Demon dies, you become the Demon.", icon: "HeartCrack", otherNightOrder: 4 },

  // Demons (1)
  { id: "imp", name: "Imp", type: "demon", ability: "Each night*, choose a player: they die. If you kill yourself this way, a Minion becomes the Imp.", icon: "Flame", otherNightOrder: 5 },
];

// Team composition rules by player count
// Format: { townsfolk, outsiders, minions, demons }
export const TEAM_COMPOSITION: Record<number, { townsfolk: number; outsiders: number; minions: number; demons: number }> = {
  5: { townsfolk: 3, outsiders: 0, minions: 1, demons: 1 },
  6: { townsfolk: 3, outsiders: 1, minions: 1, demons: 1 },
  7: { townsfolk: 5, outsiders: 0, minions: 1, demons: 1 },
  8: { townsfolk: 5, outsiders: 1, minions: 1, demons: 1 },
  9: { townsfolk: 5, outsiders: 2, minions: 1, demons: 1 },
  10: { townsfolk: 7, outsiders: 0, minions: 2, demons: 1 },
  11: { townsfolk: 7, outsiders: 1, minions: 2, demons: 1 },
  12: { townsfolk: 7, outsiders: 2, minions: 2, demons: 1 },
  13: { townsfolk: 9, outsiders: 0, minions: 3, demons: 1 },
  14: { townsfolk: 9, outsiders: 1, minions: 3, demons: 1 },
  15: { townsfolk: 9, outsiders: 2, minions: 3, demons: 1 },
};

// Available scripts
export type ScriptId = "trouble_brewing";

export const SCRIPTS: Record<ScriptId, { name: string; characters: Character[] }> = {
  trouble_brewing: { name: "Trouble Brewing", characters: TROUBLE_BREWING },
};

// Game phases
export type GamePhase = "setup" | "character_select" | "waiting_for_players" | "playing";

// Grimoire token position
export interface GrimoireToken {
  characterId: string;
  playerId?: string;
}

// Player info (client-safe, no secrets)
export interface PlayerInfo {
  id: string;
  name: string;
  isStoryteller: boolean;
}

// Full game state sent to storyteller
export interface GameState {
  lobbyId: string;
  code: string;
  phase: GamePhase;
  script: ScriptId;
  playerCount: number;
  selectedCharacters: string[];
  players: PlayerInfo[];
  tokens: GrimoireToken[];
  characterAssignments: Record<string, string>; // playerId -> characterId
}

// Player-specific game state (limited info)
export interface PlayerGameState {
  lobbyId: string;
  code: string;
  phase: GamePhase;
  playerId: string;
  playerName: string;
  assignedCharacter?: Character;
}

// ============ WebSocket Messages ============

// Client -> Server messages
export type ClientMessage =
  | { type: "CREATE_LOBBY"; playerCount: number; script: ScriptId }
  | { type: "JOIN_LOBBY"; code: string; name: string; playerId?: string }
  | { type: "SELECT_CHARACTERS"; characterIds: string[] }
  | { type: "START_GAME" }
  | { type: "REMOVE_PLAYER"; playerId: string }
  | { type: "RECONNECT"; playerId: string };

// Server -> Client messages
export type ServerMessage =
  | { type: "CONNECTED"; clientId: string }
  | { type: "LOBBY_CREATED"; lobbyId: string; code: string; playerId: string }
  | { type: "LOBBY_JOINED"; lobbyId: string; playerId: string }
  | { type: "PLAYER_JOINED"; player: PlayerInfo }
  | { type: "PLAYER_LEFT"; playerId: string }
  | { type: "PLAYER_DISCONNECTED"; playerId: string }
  | { type: "PLAYER_RECONNECTED"; playerId: string }
  | { type: "CHARACTERS_SELECTED"; characterIds: string[] }
  | { type: "CHARACTER_ASSIGNED"; character: Character }
  | { type: "GAME_STATE"; state: GameState }
  | { type: "PLAYER_GAME_STATE"; state: PlayerGameState }
  | { type: "GAME_STARTED" }
  | { type: "ERROR"; code: string; message: string };

// Utility: Get characters for night order info sheet
export function getFirstNightOrder(characters: Character[]): Character[] {
  return characters
    .filter((c) => c.firstNightOrder !== undefined)
    .sort((a, b) => (a.firstNightOrder ?? 0) - (b.firstNightOrder ?? 0));
}

export function getOtherNightOrder(characters: Character[]): Character[] {
  return characters
    .filter((c) => c.otherNightOrder !== undefined)
    .sort((a, b) => (a.otherNightOrder ?? 0) - (b.otherNightOrder ?? 0));
}

// Helper tokens for tracking game state
export interface HelperToken {
  id: string;
  name: string;
  forCharacter: string; // character id that provides this token
}

export const HELPER_TOKENS: HelperToken[] = [
  // Townsfolk
  { id: "washerwoman_townsfolk", name: "Townsfolk", forCharacter: "washerwoman" },
  { id: "washerwoman_decoy", name: "Decoy", forCharacter: "washerwoman" },
  { id: "librarian_outsider", name: "Outsider", forCharacter: "librarian" },
  { id: "librarian_decoy", name: "Decoy", forCharacter: "librarian" },
  { id: "investigator_minion", name: "Minion", forCharacter: "investigator" },
  { id: "investigator_decoy", name: "Decoy", forCharacter: "investigator" },
  { id: "fortune_teller_decoy", name: "Decoy", forCharacter: "fortune_teller" },
  { id: "monk_protected", name: "Protected", forCharacter: "monk" },
  // Outsiders
  { id: "butler_master", name: "Master", forCharacter: "butler" },
  { id: "drunk_is_the_drunk", name: "Is the Drunk", forCharacter: "drunk" },
  // Minions
  { id: "poisoner_poisoned", name: "Poisoned", forCharacter: "poisoner" },
  // Demons
  { id: "imp_die", name: "Die", forCharacter: "imp" },
];