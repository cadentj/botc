import { serve } from "@hono/node-server";
import { createNodeWebSocket } from "@hono/node-ws";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { nanoid } from "nanoid";
import { eq, and } from "drizzle-orm";
import { db } from "./db/index.js";
import { lobbies, players, grimoireTokens } from "./db/schema.js";
import type {
  ClientMessage,
  ServerMessage,
  GameState,
  PlayerGameState,
  PlayerInfo,
  GrimoireToken as GrimoireTokenType,
  ScriptId,
} from "@org/types";
import { SCRIPTS, validateCharacterSelection } from "@org/types";

const app = new Hono();

// Create WebSocket handler for Node.js
const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

// Middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: "*", // Configure appropriately for production
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  })
);

// Health check endpoint
app.get("/", (c) => {
  return c.json({ status: "ok", message: "BotC Server" });
});

// REST endpoint for fetching game state
app.get("/api/game", async (c) => {
  const sessionToken = c.req.header("X-Session-Token");

  if (!sessionToken) {
    return c.json({ error: "Missing session token" }, 401);
  }

  // Find player by session token
  const player = await db.query.players.findFirst({
    where: eq(players.sessionToken, sessionToken),
  });

  if (!player) {
    return c.json({ error: "Invalid session token" }, 401);
  }

  // If storyteller, return full game state
  if (player.isStoryteller) {
    const gameState = await getGameState(player.lobbyId);
    if (!gameState) {
      return c.json({ error: "Game not found" }, 404);
    }
    return c.json(gameState);
  }

  // Otherwise, return player-specific game state
  const playerGameState = await getPlayerGameState(player.id);
  if (!playerGameState) {
    return c.json({ error: "Game not found" }, 404);
  }
  return c.json(playerGameState);
});

// REST endpoint for updating token positions (debounced by client)
app.put("/api/tokens/:lobbyId/:characterId", async (c) => {
  const { lobbyId, characterId } = c.req.param();
  const sessionToken = c.req.header("X-Session-Token");

  if (!sessionToken) {
    return c.json({ error: "Missing session token" }, 401);
  }

  // Verify storyteller
  const player = await db.query.players.findFirst({
    where: and(eq(players.sessionToken, sessionToken), eq(players.lobbyId, lobbyId)),
  });

  if (!player?.isStoryteller) {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const body = await c.req.json<{ x: number; y: number }>();

  await db
    .update(grimoireTokens)
    .set({ positionX: body.x, positionY: body.y })
    .where(
      and(eq(grimoireTokens.lobbyId, lobbyId), eq(grimoireTokens.characterId, characterId))
    );

  return c.json({ success: true });
});

// Track connected WebSocket clients
interface ClientInfo {
  ws: {
    send: (data: string) => void;
    close: () => void;
  };
  sessionToken?: string;
  playerId?: string;
  lobbyId?: string;
}

const connectedClients = new Map<string, ClientInfo>();

// Helper to generate 4-character lobby code
function generateLobbyCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Avoid confusing chars like 0/O, 1/I
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// Helper to send message to client
function sendToClient(clientId: string, message: ServerMessage): void {
  const client = connectedClients.get(clientId);
  if (client) {
    client.ws.send(JSON.stringify(message));
  }
}

// Helper to broadcast to all clients in a lobby
function broadcastToLobby(lobbyId: string, message: ServerMessage, excludeClientId?: string): void {
  for (const [clientId, client] of connectedClients.entries()) {
    if (client.lobbyId === lobbyId && clientId !== excludeClientId) {
      client.ws.send(JSON.stringify(message));
    }
  }
}

// Helper to get full game state for storyteller
async function getGameState(lobbyId: string): Promise<GameState | null> {
  const lobby = await db.query.lobbies.findFirst({
    where: eq(lobbies.id, lobbyId),
  });

  if (!lobby) return null;

  const lobbyPlayers = await db.query.players.findMany({
    where: eq(players.lobbyId, lobbyId),
  });

  const tokens = await db.query.grimoireTokens.findMany({
    where: eq(grimoireTokens.lobbyId, lobbyId),
  });

  const playerInfos: PlayerInfo[] = lobbyPlayers.map((p) => ({
    id: p.id,
    name: p.name,
    isStoryteller: p.isStoryteller,
    connected: p.connected,
  }));

  const tokenData: GrimoireTokenType[] = tokens.map((t) => ({
    characterId: t.characterId,
    playerId: t.playerId ?? undefined,
    position: { x: t.positionX, y: t.positionY },
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

// Helper to get player-specific game state
async function getPlayerGameState(playerId: string): Promise<PlayerGameState | null> {
  const player = await db.query.players.findFirst({
    where: eq(players.id, playerId),
  });

  if (!player) return null;

  const lobby = await db.query.lobbies.findFirst({
    where: eq(lobbies.id, player.lobbyId),
  });

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

// Message handlers
async function handleCreateLobby(
  clientId: string,
  playerCount: number,
  script: ScriptId
): Promise<void> {
  // Generate unique lobby code
  let code: string;
  let existingLobby;
  do {
    code = generateLobbyCode();
    existingLobby = await db.query.lobbies.findFirst({
      where: eq(lobbies.code, code),
    });
  } while (existingLobby);

  const lobbyId = nanoid();
  const storytellerId = nanoid();
  const sessionToken = nanoid(32);

  // Create lobby
  await db.insert(lobbies).values({
    id: lobbyId,
    code,
    script,
    phase: "character_select",
    playerCount,
    createdAt: new Date(),
  });

  // Create storyteller player
  await db.insert(players).values({
    id: storytellerId,
    lobbyId,
    name: "Storyteller",
    sessionToken,
    isStoryteller: true,
    connected: true,
  });

  // Update client info
  const client = connectedClients.get(clientId);
  if (client) {
    client.sessionToken = sessionToken;
    client.playerId = storytellerId;
    client.lobbyId = lobbyId;
  }

  sendToClient(clientId, {
    type: "LOBBY_CREATED",
    lobbyId,
    code,
    sessionToken,
  });

  // Send initial game state
  const state = await getGameState(lobbyId);
  if (state) {
    sendToClient(clientId, { type: "GAME_STATE", state });
  }
}

async function handleJoinLobby(
  clientId: string,
  code: string,
  name: string,
  existingSessionToken?: string
): Promise<void> {
  const lobby = await db.query.lobbies.findFirst({
    where: eq(lobbies.code, code.toUpperCase()),
  });

  if (!lobby) {
    sendToClient(clientId, {
      type: "ERROR",
      code: "LOBBY_NOT_FOUND",
      message: "No lobby found with that code",
    });
    return;
  }

  // Check for reconnection via session token
  if (existingSessionToken) {
    const existingPlayer = await db.query.players.findFirst({
      where: and(
        eq(players.sessionToken, existingSessionToken),
        eq(players.lobbyId, lobby.id)
      ),
    });

    if (existingPlayer) {
      // Reconnect existing player
      await db
        .update(players)
        .set({ connected: true })
        .where(eq(players.id, existingPlayer.id));

      const client = connectedClients.get(clientId);
      if (client) {
        client.sessionToken = existingSessionToken;
        client.playerId = existingPlayer.id;
        client.lobbyId = lobby.id;
      }

      broadcastToLobby(lobby.id, {
        type: "PLAYER_RECONNECTED",
        playerId: existingPlayer.id,
      });

      // Send appropriate state based on player role
      if (existingPlayer.isStoryteller) {
        const state = await getGameState(lobby.id);
        if (state) {
          sendToClient(clientId, { type: "GAME_STATE", state });
        }
      } else {
        const state = await getPlayerGameState(existingPlayer.id);
        if (state) {
          sendToClient(clientId, { type: "PLAYER_GAME_STATE", state });
        }
      }
      return;
    }
  }

  // Check if lobby is full
  const existingPlayers = await db.query.players.findMany({
    where: eq(players.lobbyId, lobby.id),
  });

  const nonStorytellerCount = existingPlayers.filter((p) => !p.isStoryteller).length;
  if (nonStorytellerCount >= lobby.playerCount) {
    sendToClient(clientId, {
      type: "ERROR",
      code: "LOBBY_FULL",
      message: "This game is full",
    });
    return;
  }

  // Create new player
  const playerId = nanoid();
  const sessionToken = nanoid(32);

  await db.insert(players).values({
    id: playerId,
    lobbyId: lobby.id,
    name,
    sessionToken,
    isStoryteller: false,
    connected: true,
  });

  const client = connectedClients.get(clientId);
  if (client) {
    client.sessionToken = sessionToken;
    client.playerId = playerId;
    client.lobbyId = lobby.id;
  }

  // Notify the joining player
  sendToClient(clientId, {
    type: "LOBBY_JOINED",
    lobbyId: lobby.id,
    playerId,
    sessionToken,
  });

  // Broadcast to others in lobby
  broadcastToLobby(
    lobby.id,
    {
      type: "PLAYER_JOINED",
      player: {
        id: playerId,
        name,
        isStoryteller: false,
        connected: true,
      },
    },
    clientId
  );

  // If game is in playing phase, assign a character
  if (lobby.phase === "waiting_for_players" && lobby.selectedCharacters) {
    const selectedChars: string[] = JSON.parse(lobby.selectedCharacters);
    const assignedChars = existingPlayers
      .filter((p) => p.characterId)
      .map((p) => p.characterId);

    const availableChars = selectedChars.filter((c) => !assignedChars.includes(c));

    if (availableChars.length > 0) {
      const randomChar = availableChars[Math.floor(Math.random() * availableChars.length)];
      await db
        .update(players)
        .set({ characterId: randomChar })
        .where(eq(players.id, playerId));

      const script = SCRIPTS[lobby.script];
      const character = script?.characters.find((c) => c.id === randomChar);

      if (character) {
        sendToClient(clientId, {
          type: "CHARACTER_ASSIGNED",
          character,
        });
      }
    }
  }

  // Send player state
  const playerState = await getPlayerGameState(playerId);
  if (playerState) {
    sendToClient(clientId, { type: "PLAYER_GAME_STATE", state: playerState });
  }
}

async function handleSelectCharacters(
  clientId: string,
  characterIds: string[]
): Promise<void> {
  const client = connectedClients.get(clientId);
  if (!client?.lobbyId) {
    sendToClient(clientId, {
      type: "ERROR",
      code: "NOT_IN_LOBBY",
      message: "You are not in a lobby",
    });
    return;
  }

  // Verify storyteller
  const player = await db.query.players.findFirst({
    where: eq(players.id, client.playerId ?? ""),
  });

  if (!player?.isStoryteller) {
    sendToClient(clientId, {
      type: "ERROR",
      code: "NOT_STORYTELLER",
      message: "Only the storyteller can select characters",
    });
    return;
  }

  const lobby = await db.query.lobbies.findFirst({
    where: eq(lobbies.id, client.lobbyId),
  });

  if (!lobby) return;

  // Validate selection
  const validation = validateCharacterSelection(characterIds, lobby.playerCount, lobby.script);
  if (!validation.valid) {
    sendToClient(clientId, {
      type: "ERROR",
      code: "INVALID_SELECTION",
      message: validation.error ?? "Invalid character selection",
    });
    return;
  }

  // Update lobby
  await db
    .update(lobbies)
    .set({
      selectedCharacters: JSON.stringify(characterIds),
      phase: "waiting_for_players",
    })
    .where(eq(lobbies.id, lobby.id));

  // Create grimoire tokens for each character
  for (let i = 0; i < characterIds.length; i++) {
    const characterId = characterIds[i];
    if (!characterId) continue;

    const angle = (2 * Math.PI * i) / characterIds.length - Math.PI / 2;
    const radius = 200;
    const x = Math.round(250 + radius * Math.cos(angle));
    const y = Math.round(250 + radius * Math.sin(angle));

    await db.insert(grimoireTokens).values({
      id: nanoid(),
      lobbyId: lobby.id,
      characterId,
      positionX: x,
      positionY: y,
    });
  }

  // Broadcast to all in lobby
  broadcastToLobby(lobby.id, {
    type: "CHARACTERS_SELECTED",
    characterIds,
  });

  // Send updated state to storyteller
  const state = await getGameState(lobby.id);
  if (state) {
    sendToClient(clientId, { type: "GAME_STATE", state });
  }
}

async function handleRemovePlayer(clientId: string, playerId: string): Promise<void> {
  const client = connectedClients.get(clientId);
  if (!client?.lobbyId) return;

  // Verify storyteller
  const storyteller = await db.query.players.findFirst({
    where: eq(players.id, client.playerId ?? ""),
  });

  if (!storyteller?.isStoryteller) {
    sendToClient(clientId, {
      type: "ERROR",
      code: "NOT_STORYTELLER",
      message: "Only the storyteller can remove players",
    });
    return;
  }

  // Get the player to be removed
  const targetPlayer = await db.query.players.findFirst({
    where: eq(players.id, playerId),
  });

  if (!targetPlayer || targetPlayer.isStoryteller) {
    sendToClient(clientId, {
      type: "ERROR",
      code: "CANNOT_REMOVE",
      message: "Cannot remove this player",
    });
    return;
  }

  // Unassign character from grimoire token
  if (targetPlayer.characterId) {
    await db
      .update(grimoireTokens)
      .set({ playerId: null })
      .where(
        and(
          eq(grimoireTokens.lobbyId, client.lobbyId),
          eq(grimoireTokens.characterId, targetPlayer.characterId)
        )
      );
  }

  // Delete player
  await db.delete(players).where(eq(players.id, playerId));

  // Broadcast
  broadcastToLobby(client.lobbyId, {
    type: "PLAYER_LEFT",
    playerId,
  });

  // Disconnect the removed player's client
  for (const [cid, c] of connectedClients.entries()) {
    if (c.playerId === playerId) {
      c.ws.send(
        JSON.stringify({
          type: "ERROR",
          code: "REMOVED",
          message: "You have been removed from the game",
        })
      );
      c.ws.close();
      connectedClients.delete(cid);
      break;
    }
  }

  // Send updated state to storyteller
  const state = await getGameState(client.lobbyId);
  if (state) {
    sendToClient(clientId, { type: "GAME_STATE", state });
  }
}

async function handleReconnect(clientId: string, sessionToken: string): Promise<void> {
  const player = await db.query.players.findFirst({
    where: eq(players.sessionToken, sessionToken),
  });

  if (!player) {
    sendToClient(clientId, {
      type: "ERROR",
      code: "INVALID_SESSION",
      message: "Session not found",
    });
    return;
  }

  // Update connection status
  await db
    .update(players)
    .set({ connected: true })
    .where(eq(players.id, player.id));

  const client = connectedClients.get(clientId);
  if (client) {
    client.sessionToken = sessionToken;
    client.playerId = player.id;
    client.lobbyId = player.lobbyId;
  }

  broadcastToLobby(
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
      sendToClient(clientId, { type: "GAME_STATE", state });
    }
  } else {
    const state = await getPlayerGameState(player.id);
    if (state) {
      sendToClient(clientId, { type: "PLAYER_GAME_STATE", state });
    }
  }
}

async function handleStartGame(clientId: string): Promise<void> {
  const client = connectedClients.get(clientId);
  if (!client?.lobbyId) return;

  // Verify storyteller
  const player = await db.query.players.findFirst({
    where: eq(players.id, client.playerId ?? ""),
  });

  if (!player?.isStoryteller) {
    sendToClient(clientId, {
      type: "ERROR",
      code: "NOT_STORYTELLER",
      message: "Only the storyteller can start the game",
    });
    return;
  }

  const lobby = await db.query.lobbies.findFirst({
    where: eq(lobbies.id, client.lobbyId),
  });

  if (!lobby) return;

  // Update phase
  await db
    .update(lobbies)
    .set({ phase: "playing" })
    .where(eq(lobbies.id, client.lobbyId));

  // Broadcast
  broadcastToLobby(client.lobbyId, { type: "GAME_STARTED" });

  // Send updated state
  const state = await getGameState(client.lobbyId);
  if (state) {
    sendToClient(clientId, { type: "GAME_STATE", state });
  }
}

// WebSocket endpoint
app.get(
  "/ws",
  upgradeWebSocket((_c) => {
    const clientId = crypto.randomUUID();

    return {
      onOpen: (_event, ws) => {
        console.log(`Client connected: ${clientId}`);
        connectedClients.set(clientId, { ws: ws as any });

        (ws as any).send(
          JSON.stringify({
            type: "CONNECTED",
            clientId,
          })
        );
      },

      onMessage: async (event, ws) => {
        try {
          const message = JSON.parse(event.data.toString()) as ClientMessage;
          console.log(`Message from ${clientId}:`, message);

          switch (message.type) {
            case "CREATE_LOBBY":
              await handleCreateLobby(clientId, message.playerCount, message.script);
              break;
            case "JOIN_LOBBY":
              await handleJoinLobby(clientId, message.code, message.name, message.sessionToken);
              break;
            case "SELECT_CHARACTERS":
              await handleSelectCharacters(clientId, message.characterIds);
              break;
            case "START_GAME":
              await handleStartGame(clientId);
              break;
            case "REMOVE_PLAYER":
              await handleRemovePlayer(clientId, message.playerId);
              break;
            case "RECONNECT":
              await handleReconnect(clientId, message.sessionToken);
              break;
            default:
              (ws as any).send(
                JSON.stringify({
                  type: "ERROR",
                  code: "UNKNOWN_MESSAGE",
                  message: "Unknown message type",
                })
              );
          }
        } catch (error) {
          console.error(`Error processing message from ${clientId}:`, error);
          (ws as any).send(
            JSON.stringify({
              type: "ERROR",
              code: "INVALID_MESSAGE",
              message: "Failed to parse message",
            })
          );
        }
      },

      onClose: async (_event, _ws) => {
        console.log(`Client disconnected: ${clientId}`);
        const client = connectedClients.get(clientId);

        if (client?.playerId) {
          // Mark player as disconnected
          await db
            .update(players)
            .set({ connected: false })
            .where(eq(players.id, client.playerId));

          if (client.lobbyId) {
            broadcastToLobby(client.lobbyId, {
              type: "PLAYER_DISCONNECTED",
              playerId: client.playerId,
            });
          }
        }

        connectedClients.delete(clientId);
      },

      onError: (event, _ws) => {
        console.error(`WebSocket error for ${clientId}:`, event);
        connectedClients.delete(clientId);
      },
    };
  })
);

// Start server
const port = Number(process.env.PORT) || 3000;
const server = serve({ fetch: app.fetch, port });

// Inject WebSocket handling into the server
injectWebSocket(server);

// Graceful shutdown
const shutdown = () => {
  console.log("Shutting down gracefully...");

  // Close all WebSocket connections
  for (const [clientId, client] of Array.from(connectedClients.entries())) {
    try {
      client.ws.close();
    } catch (error) {
      console.error(`Error closing connection ${clientId}:`, error);
    }
  }

  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

console.log(`Server running on port ${port}`);
