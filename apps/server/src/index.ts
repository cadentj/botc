import { serve } from "@hono/node-server";
import { createNodeWebSocket } from "@hono/node-ws";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import type { ClientMessage } from "@org/types";
import { connectionManager } from "./connections.js";
import { playerService, tokenService } from "./services/index.js";
import { getGameState, getPlayerGameState } from "./state/index.js";
import {
  handleCreateLobby,
  handleJoinLobby,
  handleSelectCharacters,
  handleStartGame,
  handleRemovePlayer,
  handleReconnect,
} from "./handlers/index.js";

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
  const playerId = c.req.header("X-Player-Id");

  if (!playerId) {
    return c.json({ error: "Missing player id" }, 401);
  }

  // Find player by id
  const player = await playerService.findById(playerId);

  if (!player) {
    return c.json({ error: "Invalid player id" }, 401);
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
  const playerId = c.req.header("X-Player-Id");

  if (!playerId) {
    return c.json({ error: "Missing player id" }, 401);
  }

  // Verify storyteller
  const player = await playerService.findById(playerId);

  if (!player || player.lobbyId !== lobbyId || !player.isStoryteller) {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const body = await c.req.json<{ x: number; y: number }>();

  await tokenService.updatePosition(lobbyId, characterId, body.x, body.y);

  return c.json({ success: true });
});


// WebSocket endpoint
app.get(
  "/ws",
  upgradeWebSocket((_c) => {
    const clientId = crypto.randomUUID();

    return {
      onOpen: (_event, ws) => {
        console.log(`Client connected: ${clientId}`);
        connectionManager.register(clientId, ws as any);

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
              await handleJoinLobby(clientId, message.code, message.name, message.playerId);
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
              await handleReconnect(clientId, message.playerId);
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
        const client = connectionManager.get(clientId);

        if (client?.playerId) {
          if (client.lobbyId) {
            connectionManager.broadcastToLobby(client.lobbyId, {
              type: "PLAYER_DISCONNECTED",
              playerId: client.playerId,
            });
          }
        }

        connectionManager.remove(clientId);
      },

      onError: (event, _ws) => {
        console.error(`WebSocket error for ${clientId}:`, event);
        connectionManager.remove(clientId);
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
  for (const [clientId, client] of Array.from(connectionManager.getAll().entries())) {
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
