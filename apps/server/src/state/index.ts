import { SCRIPTS } from "@org/types";
import type {
  GameState,
  PlayerGameState,
  PlayerInfo,
  GrimoireToken as GrimoireTokenType,
} from "@org/types";
import { lobbyService, playerService } from "../services/index.js";

export async function getGameState(lobbyId: string): Promise<GameState | null> {
  const lobby = await lobbyService.findById(lobbyId);
  if (!lobby) return null;

  const lobbyPlayers = await playerService.findByLobbyId(lobbyId);

  const playerInfos: PlayerInfo[] = lobbyPlayers.map((p) => ({
    id: p.id,
    name: p.name,
    isStoryteller: p.isStoryteller,
  }));

  const tokenData: GrimoireTokenType[] = (lobby.selectedCharacters 
    ? JSON.parse(lobby.selectedCharacters) 
    : []
  ).map((characterId: string) => ({
    characterId,
    playerId: lobbyPlayers.find(p => p.characterId === characterId)?.id,
  }));

  const characterAssignments: Record<string, string> = {};
  for (const p of lobbyPlayers) {
    if (p.characterId) {
      characterAssignments[p.id] = p.characterId;
    }
  }

  return {
    lobbyId: lobby.id,
    code: lobby.code,
    phase: lobby.phase,
    script: lobby.script,
    playerCount: lobby.playerCount,
    selectedCharacters: lobby.selectedCharacters ? JSON.parse(lobby.selectedCharacters) : [],
    players: playerInfos,
    tokens: tokenData,
    characterAssignments,
  };
}

export async function getPlayerGameState(playerId: string): Promise<PlayerGameState | null> {
  const player = await playerService.findById(playerId);
  if (!player) return null;

  const lobby = await lobbyService.findById(player.lobbyId);
  if (!lobby) return null;

  const script = SCRIPTS[lobby.script];
  const assignedCharacter = player.characterId
    ? script?.characters.find((c) => c.id === player.characterId)
    : undefined;

  return {
    lobbyId: lobby.id,
    code: lobby.code,
    phase: lobby.phase,
    playerId: player.id,
    playerName: player.name,
    assignedCharacter,
  };
}

