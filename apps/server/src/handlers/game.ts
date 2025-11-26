import { connectionManager } from "../connections.js";
import { lobbyService } from "../services/index.js";
import { getGameState } from "../state/index.js";

export async function handleSelectCharacters(
  clientId: string,
  characterIds: string[]
): Promise<void> {
  const client = connectionManager.get(clientId);
  if (!client?.lobbyId) {
    connectionManager.sendToClient(clientId, {
      type: "ERROR",
      code: "NOT_IN_LOBBY",
      message: "You are not in a lobby",
    });
    return;
  }

  // NOTE(cadentj): Omit verifying the player is a storyteller

  const lobby = await lobbyService.findById(client.lobbyId);
  if (!lobby) return;

  // NOTE(cadentj): Omit validating the initial selection, that is done on the client

  // Update lobby
  await lobbyService.updatePhaseAndCharacters(client.lobbyId, "waiting_for_players", characterIds);

  // Broadcast to all in lobby
  connectionManager.broadcastToLobby(client.lobbyId, {
    type: "CHARACTERS_SELECTED",
    characterIds,
  });

  // Send updated state to storyteller
  const state = await getGameState(client.lobbyId);
  if (state) {
    connectionManager.sendToClient(clientId, { type: "GAME_STATE", state });
  }
}

export async function handleStartGame(clientId: string): Promise<void> {
  const client = connectionManager.get(clientId);
  if (!client?.lobbyId) return;

  // NOTE(cadentj): Omit verifying the player is a storyteller

  // Get the lobby
  const lobby = await lobbyService.findById(client.lobbyId);
  if (!lobby) return;

  // Update phase
  await lobbyService.updatePhase(client.lobbyId, "playing");

  // Broadcast
  connectionManager.broadcastToLobby(client.lobbyId, { type: "GAME_STARTED" });

  // Send updated state
  const state = await getGameState(client.lobbyId);
  if (state) {
    connectionManager.sendToClient(clientId, { type: "GAME_STATE", state });
  }
}


