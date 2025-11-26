// Character types
export type CharacterType = "townsfolk" | "outsider" | "minion" | "demon";

export interface Character {
  id: string;
  name: string;
  type: CharacterType;
  ability: string;
  firstNightOrder?: number; // Order to wake on first night (undefined = doesn't wake)
  otherNightOrder?: number; // Order to wake on other nights (undefined = doesn't wake)
}

// Placeholder Trouble Brewing characters - fill in real data later
export const TROUBLE_BREWING: Character[] = [
  // Townsfolk (13)
  { id: "washerwoman", name: "Washerwoman", type: "townsfolk", ability: "TODO: You start knowing...", firstNightOrder: 1 },
  { id: "librarian", name: "Librarian", type: "townsfolk", ability: "TODO: You start knowing...", firstNightOrder: 2 },
  { id: "investigator", name: "Investigator", type: "townsfolk", ability: "TODO: You start knowing...", firstNightOrder: 3 },
  { id: "chef", name: "Chef", type: "townsfolk", ability: "TODO: You start knowing...", firstNightOrder: 4 },
  { id: "empath", name: "Empath", type: "townsfolk", ability: "TODO: Each night...", firstNightOrder: 5, otherNightOrder: 1 },
  { id: "fortune_teller", name: "Fortune Teller", type: "townsfolk", ability: "TODO: Each night...", firstNightOrder: 6, otherNightOrder: 2 },
  { id: "undertaker", name: "Undertaker", type: "townsfolk", ability: "TODO: Each night...", otherNightOrder: 3 },
  { id: "monk", name: "Monk", type: "townsfolk", ability: "TODO: Each night...", otherNightOrder: 4 },
  { id: "ravenkeeper", name: "Ravenkeeper", type: "townsfolk", ability: "TODO: If you die at night..." },
  { id: "virgin", name: "Virgin", type: "townsfolk", ability: "TODO: The first time you are nominated..." },
  { id: "slayer", name: "Slayer", type: "townsfolk", ability: "TODO: Once per game, during the day..." },
  { id: "soldier", name: "Soldier", type: "townsfolk", ability: "TODO: You are safe from the Demon." },
  { id: "mayor", name: "Mayor", type: "townsfolk", ability: "TODO: If only 3 players live..." },

  // Outsiders (4)
  { id: "butler", name: "Butler", type: "outsider", ability: "TODO: Each night, choose a player...", firstNightOrder: 7, otherNightOrder: 5 },
  { id: "drunk", name: "Drunk", type: "outsider", ability: "TODO: You do not know you are the Drunk..." },
  { id: "recluse", name: "Recluse", type: "outsider", ability: "TODO: You might register as evil..." },
  { id: "saint", name: "Saint", type: "outsider", ability: "TODO: If you die by execution..." },

  // Minions (4)
  { id: "poisoner", name: "Poisoner", type: "minion", ability: "TODO: Each night, choose a player...", firstNightOrder: 8, otherNightOrder: 6 },
  { id: "spy", name: "Spy", type: "minion", ability: "TODO: Each night, you see the Grimoire...", firstNightOrder: 9, otherNightOrder: 7 },
  { id: "baron", name: "Baron", type: "minion", ability: "TODO: There are extra Outsiders in play." },
  { id: "scarlet_woman", name: "Scarlet Woman", type: "minion", ability: "TODO: If there are 5 or more players alive..." },

  // Demons (1)
  { id: "imp", name: "Imp", type: "demon", ability: "TODO: Each night, choose a player...", otherNightOrder: 8 },
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
  position: { x: number; y: number };
}

// Player info (client-safe, no secrets)
export interface PlayerInfo {
  id: string;
  name: string;
  isStoryteller: boolean;
  connected: boolean;
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
  | { type: "JOIN_LOBBY"; code: string; name: string; sessionToken?: string }
  | { type: "SELECT_CHARACTERS"; characterIds: string[] }
  | { type: "START_GAME" }
  | { type: "REMOVE_PLAYER"; playerId: string }
  | { type: "RECONNECT"; sessionToken: string };

// Server -> Client messages
export type ServerMessage =
  | { type: "CONNECTED"; clientId: string }
  | { type: "LOBBY_CREATED"; lobbyId: string; code: string; sessionToken: string }
  | { type: "LOBBY_JOINED"; lobbyId: string; playerId: string; sessionToken: string }
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

// Utility: Validate character selection against composition rules
export function validateCharacterSelection(
  characterIds: string[],
  playerCount: number,
  script: ScriptId
): { valid: boolean; error?: string } {
  const composition = TEAM_COMPOSITION[playerCount];
  if (!composition) {
    return { valid: false, error: `Invalid player count: ${playerCount}` };
  }

  const scriptData = SCRIPTS[script];
  if (!scriptData) {
    return { valid: false, error: `Invalid script: ${script}` };
  }

  const characters = characterIds.map((id) => scriptData.characters.find((c) => c.id === id));
  if (characters.some((c) => !c)) {
    return { valid: false, error: "Unknown character in selection" };
  }

  const counts = {
    townsfolk: characters.filter((c) => c?.type === "townsfolk").length,
    outsiders: characters.filter((c) => c?.type === "outsider").length,
    minions: characters.filter((c) => c?.type === "minion").length,
    demons: characters.filter((c) => c?.type === "demon").length,
  };

  if (counts.townsfolk !== composition.townsfolk) {
    return { valid: false, error: `Need ${composition.townsfolk} townsfolk, got ${counts.townsfolk}` };
  }
  if (counts.outsiders !== composition.outsiders) {
    return { valid: false, error: `Need ${composition.outsiders} outsiders, got ${counts.outsiders}` };
  }
  if (counts.minions !== composition.minions) {
    return { valid: false, error: `Need ${composition.minions} minions, got ${counts.minions}` };
  }
  if (counts.demons !== composition.demons) {
    return { valid: false, error: `Need ${composition.demons} demons, got ${counts.demons}` };
  }

  return { valid: true };
}

