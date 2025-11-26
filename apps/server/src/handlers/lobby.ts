import { nanoid } from "nanoid";
import type { ScriptId } from "@org/types";
import { SCRIPTS } from "@org/types";
import { connectionManager } from "../connections.js";
import { lobbyService, playerService } from "../services/index.js";
import { getGameState, getPlayerGameState } from "../state/index.js";

// Helper to generate 4-character lobby code
function generateLobbyCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Avoid confusing chars like 0/O, 1/I
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function handleCreateLobby(
  clientId: string,
  playerCount: number,
  script: ScriptId
): Promise<void> {
  // Generate unique lobby code
  let code: string;
  let existingLobby;
  do {
    code = generateLobbyCode();
    existingLobby = await lobbyService.findByCode(code);
  } while (existingLobby);

  const lobbyId = nanoid();
  const storytellerId = nanoid();

  // Create lobby
  await lobbyService.create({
    id: lobbyId,
    code,
    script,
    phase: "character_select",
    playerCount,
    createdAt: new Date(),
  });

  // Create storyteller player
  await playerService.create({
    id: storytellerId,
    lobbyId,
    name: "Storyteller",
    isStoryteller: true,
  });

  // Update client info
  connectionManager.update(clientId, {
    playerId: storytellerId,
    lobbyId,
  });

  connectionManager.sendToClient(clientId, {
    type: "LOBBY_CREATED",
    lobbyId,
    code,
    playerId: storytellerId,
  });

  // Send initial game state
  const state = await getGameState(lobbyId);
  if (state) {
    connectionManager.sendToClient(clientId, { type: "GAME_STATE", state });
  }
}

export async function handleJoinLobby(
  clientId: string,
  code: string,
  name: string,
  existingPlayerId?: string
): Promise<void> {
  const lobby = await lobbyService.findByCode(code.toUpperCase());

  if (!lobby) {
    connectionManager.sendToClient(clientId, {
      type: "ERROR",
      code: "LOBBY_NOT_FOUND",
      message: "No lobby found with that code",
    });
    return;
  }

  // Check for reconnection via player id
  if (existingPlayerId) {
    const existingPlayer = await playerService.findById(existingPlayerId);

    if (existingPlayer && existingPlayer.lobbyId === lobby.id) {
      // Reconnect existing player
      connectionManager.update(clientId, {
        playerId: existingPlayer.id,
        lobbyId: lobby.id,
      });

      connectionManager.broadcastToLobby(
        lobby.id,
        {
          type: "PLAYER_RECONNECTED",
          playerId: existingPlayer.id,
        },
        clientId
      );

      // Send appropriate state based on player role
      if (existingPlayer.isStoryteller) {
        const state = await getGameState(lobby.id);
        if (state) {
          connectionManager.sendToClient(clientId, { type: "GAME_STATE", state });
        }
      } else {
        const state = await getPlayerGameState(existingPlayer.id);
        if (state) {
          connectionManager.sendToClient(clientId, { type: "PLAYER_GAME_STATE", state });
        }
      }
      return;
    }
  }

  // Check if lobby is full
  const existingPlayers = await playerService.findByLobbyId(lobby.id);
  const nonStorytellerCount = existingPlayers.filter((p) => !p.isStoryteller).length;
  if (nonStorytellerCount >= lobby.playerCount) {
    connectionManager.sendToClient(clientId, {
      type: "ERROR",
      code: "LOBBY_FULL",
      message: "This game is full",
    });
    return;
  }

  // Create new player
  const playerId = nanoid();

  await playerService.create({
    id: playerId,
    lobbyId: lobby.id,
    name,
    isStoryteller: false,
  });

  connectionManager.update(clientId, {
    playerId,
    lobbyId: lobby.id,
  });

  // Notify the joining player
  connectionManager.sendToClient(clientId, {
    type: "LOBBY_JOINED",
    lobbyId: lobby.id,
    playerId,
  });

  // Broadcast to others in lobby
  connectionManager.broadcastToLobby(
    lobby.id,
    {
      type: "PLAYER_JOINED",
      player: {
        id: playerId,
        name,
        isStoryteller: false,
      },
    },
    clientId
  );

  // If game is in waiting_for_players phase, assign a character
  if (lobby.phase === "waiting_for_players" && lobby.selectedCharacters) {
    const selectedChars: string[] = JSON.parse(lobby.selectedCharacters);
    const assignedChars = existingPlayers.filter((p) => p.characterId).map((p) => p.characterId);

    const availableChars = selectedChars.filter((c) => !assignedChars.includes(c));

    if (availableChars.length > 0) {
      const randomChar = availableChars[Math.floor(Math.random() * availableChars.length)];
      await playerService.updateCharacterId(playerId, randomChar);

      const script = SCRIPTS[lobby.script];
      const character = script?.characters.find((c) => c.id === randomChar);

      if (character) {
        connectionManager.sendToClient(clientId, {
          type: "CHARACTER_ASSIGNED",
          character,
        });
      }
    }
  }

  // Send player state
  const playerState = await getPlayerGameState(playerId);
  if (playerState) {
    connectionManager.sendToClient(clientId, { type: "PLAYER_GAME_STATE", state: playerState });
  }
}

