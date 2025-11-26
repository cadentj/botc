import { serve } from "@hono/node-server";
import { createNodeWebSocket } from "@hono/node-ws";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";

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

// Track connected WebSocket clients
const connectedClients = new Map<
  string,
  {
    ws: any;
    sessionToken?: string;
    playerId?: string;
  }
>();

// WebSocket endpoint
app.get(
  "/ws",
  upgradeWebSocket((c) => {
    const clientId = crypto.randomUUID();

    return {
      onOpen: (event, ws) => {
        console.log(`Client connected: ${clientId}`);
        connectedClients.set(clientId, { ws });

        ws.send(
          JSON.stringify({
            type: "CONNECTED",
            clientId,
          })
        );
      },

      onMessage: (event, ws) => {
        try {
          const message = JSON.parse(event.data.toString());
          console.log(`Message from ${clientId}:`, message);

          // Echo back confirmation for now
          ws.send(
            JSON.stringify({
              type: "MESSAGE_RECEIVED",
              originalType: message.type,
              clientId,
            })
          );
        } catch (error) {
          console.error(`Error parsing message from ${clientId}:`, error);
          ws.send(
            JSON.stringify({
              type: "ERROR",
              code: "INVALID_MESSAGE",
              message: "Failed to parse message",
            })
          );
        }
      },

      onClose: (event, ws) => {
        console.log(`Client disconnected: ${clientId}`);
        connectedClients.delete(clientId);
      },

      onError: (event, ws) => {
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
