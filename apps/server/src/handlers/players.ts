import { connectionManager } from "../connections.js";
import { playerService, tokenService } from "../services/index.js";
import { getGameState, getPlayerGameState } from "../state/index.js";

export async function handleRemovePlayer(clientId: string, playerId: string): Promise<void> {
  const client = connectionManager.get(clientId);
  if (!client?.lobbyId) return;

  // NOTE(cadentj): Omit verifying the player is a storyteller

  // Get the player to be removed
  const targetPlayer = await playerService.findById(playerId);

  if (!targetPlayer || targetPlayer.isStoryteller) {
    connectionManager.sendToClient(clientId, {
      type: "ERROR",
      code: "CANNOT_REMOVE",
      message: "Cannot remove this player",
    });
    return;
  }

  // Unassign character from grimoire token
  if (targetPlayer.characterId) {
    await tokenService.updatePlayerId(client.lobbyId, targetPlayer.characterId, null);
  }

  // Delete player
  await playerService.delete(playerId);

  // Broadcast
  connectionManager.broadcastToLobby(client.lobbyId, {
    type: "PLAYER_LEFT",
    playerId,
  });

  // Disconnect the removed player's client
  connectionManager.disconnectPlayer(playerId, {
    type: "ERROR",
    code: "REMOVED",
    message: "You have been removed from the game",
  });

  // Send updated state to storyteller
  const state = await getGameState(client.lobbyId);
  if (state) {
    connectionManager.sendToClient(clientId, { type: "GAME_STATE", state });
  }
}

export async function handleReconnect(clientId: string, sessionToken: string): Promise<void> {
  const player = await playerService.findBySessionToken(sessionToken);

  if (!player) {
    connectionManager.sendToClient(clientId, {
      type: "ERROR",
      code: "INVALID_SESSION",
      message: "Session not found",
    });
    return;
  }

  // Update connection status
  await playerService.updateConnected(player.id, true);

  connectionManager.update(clientId, {
    sessionToken,
    playerId: player.id,
    lobbyId: player.lobbyId,
  });

  connectionManager.broadcastToLobby(
    player.lobbyId,
    {
      type: "PLAYER_RECONNECTED",
      playerId: player.id,
    },
    clientId
  );

  // Send appropriate state
  if (player.isStoryteller) {
    const state = await getGameState(player.lobbyId);
    if (state) {
      connectionManager.sendToClient(clientId, { type: "GAME_STATE", state });
    }
  } else {
    const state = await getPlayerGameState(player.id);
    if (state) {
      connectionManager.sendToClient(clientId, { type: "PLAYER_GAME_STATE", state });
    }
  }
}

