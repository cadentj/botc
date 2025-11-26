import { validateCharacterSelection } from "@org/types";
import { connectionManager } from "../connections.js";
import { lobbyService } from "../services/index.js";
import { tokenService } from "../services/tokens.js";
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

  // Validate selection
  const validation = validateCharacterSelection(characterIds, lobby.playerCount, lobby.script);
  if (!validation.valid) {
    connectionManager.sendToClient(clientId, {
      type: "ERROR",
      code: "INVALID_SELECTION",
      message: validation.error ?? "Invalid character selection",
    });
    return;
  }

  // Update lobby
  await lobbyService.updatePhaseAndCharacters(client.lobbyId, "waiting_for_players", characterIds);

  // Create grimoire tokens for each character
  const tokens = [];
  for (let i = 0; i < characterIds.length; i++) {
    const characterId = characterIds[i];
    if (!characterId) continue;

    const angle = (2 * Math.PI * i) / characterIds.length - Math.PI / 2;
    const radius = 200;
    const x = Math.round(250 + radius * Math.cos(angle));
    const y = Math.round(250 + radius * Math.sin(angle));

    tokens.push({
      lobbyId: client.lobbyId,
      characterId,
      positionX: x,
      positionY: y,
    });
  }

  await tokenService.createMany(tokens);

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

