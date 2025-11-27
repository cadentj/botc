import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";

import { SCRIPTS } from "@org/types";

const app = new Hono();

// In-memory lobby store
interface Lobby {
  code: string;
  script: ScriptId;
  playerCount: number;
  selectedCharacters: string[] | null;
  phase: GamePhase;
  assignedCharacters: string[]; // characters already given out
}

const lobbies = new Map<string, Lobby>(); // code -> Lobby

// Helper to generate 4-character lobby code
function generateLobbyCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Avoid confusing chars like 0/O, 1/I
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

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

// Create lobby
app.post("/api/lobby", async (c) => {
  try {
    const body = await c.req.json();
    const { playerCount, script } = body as { playerCount: number; script: ScriptId };

    if (!playerCount || !script) {
      return c.json({ error: "Missing playerCount or script" }, 400);
    }

    // Generate unique lobby code
    let code: string;
    do {
      code = generateLobbyCode();
    } while (lobbies.has(code));

    // Create lobby
    const lobby: Lobby = {
      code,
      script,
      playerCount,
      selectedCharacters: null,
      phase: "character_select",
      assignedCharacters: [],
    };

    lobbies.set(code, lobby);

    return c.json({ code });
  } catch (error) {
    console.error("Error creating lobby:", error);
    return c.json({ error: "Failed to create lobby" }, 500);
  }
});

// Get lobby info (for storyteller grimoire)
app.get("/api/lobby/:code", async (c) => {
  try {
    const code = c.req.param("code").toUpperCase();
    const lobby = lobbies.get(code);

    if (!lobby) {
      return c.json({ error: "Lobby not found" }, 404);
    }

    const tokens = lobby.selectedCharacters
      ? lobby.selectedCharacters.map((characterId) => ({
          characterId,
        }))
      : [];

    return c.json({
      code: lobby.code,
      script: lobby.script,
      playerCount: lobby.playerCount,
      phase: lobby.phase,
      selectedCharacters: lobby.selectedCharacters || [],
      tokens,
    });
  } catch (error) {
    console.error("Error fetching lobby:", error);
    return c.json({ error: "Failed to fetch lobby" }, 500);
  }
});

// Set selected characters (storyteller only)
app.post("/api/lobby/:code/characters", async (c) => {
  try {
    const code = c.req.param("code").toUpperCase();
    const body = await c.req.json();
    const { characterIds } = body as { characterIds: string[] };

    if (!characterIds || !Array.isArray(characterIds)) {
      return c.json({ error: "Missing or invalid characterIds" }, 400);
    }

    const lobby = lobbies.get(code);
    if (!lobby) {
      return c.json({ error: "Lobby not found" }, 404);
    }

    if (lobby.phase !== "character_select") {
      return c.json({ error: "Lobby is not in character selection phase" }, 400);
    }

    // Update lobby
    lobby.selectedCharacters = characterIds;
    lobby.phase = "waiting_for_players";

    return c.json({ success: true });
  } catch (error) {
    console.error("Error selecting characters:", error);
    return c.json({ error: "Failed to select characters" }, 500);
  }
});

// Join lobby and get next available character
app.post("/api/lobby/:code/join", async (c) => {
  try {
    const code = c.req.param("code").toUpperCase();
    const lobby = lobbies.get(code);

    if (!lobby) {
      return c.json({ error: "No lobby found with that code" }, 404);
    }

    if (lobby.phase !== "waiting_for_players") {
      return c.json({ error: "Lobby is not accepting players" }, 400);
    }

    if (!lobby.selectedCharacters) {
      return c.json({ error: "Characters not yet selected" }, 400);
    }

    // Check if lobby is full
    if (lobby.assignedCharacters.length >= lobby.playerCount) {
      return c.json({ error: "This game is full" }, 400);
    }

    // Get next available character
    const availableChars = lobby.selectedCharacters.filter(
      (c) => !lobby.assignedCharacters.includes(c)
    );

    if (availableChars.length === 0) {
      return c.json({ error: "No characters available" }, 400);
    }

    // Assign random character
    const randomChar = availableChars[Math.floor(Math.random() * availableChars.length)]!;
    lobby.assignedCharacters.push(randomChar);

    const script = SCRIPTS[lobby.script];
    const character = script?.characters.find((c) => c.id === randomChar);

    return c.json({
      character,
    });
  } catch (error) {
    console.error("Error joining lobby:", error);
    return c.json({ error: "Failed to join lobby" }, 500);
  }
});

// Start game (change phase to playing)
app.post("/api/lobby/:code/start", async (c) => {
  try {
    const code = c.req.param("code").toUpperCase();
    const lobby = lobbies.get(code);

    if (!lobby) {
      return c.json({ error: "Lobby not found" }, 404);
    }

    if (lobby.phase !== "waiting_for_players") {
      return c.json({ error: "Lobby is not in waiting phase" }, 400);
    }

    lobby.phase = "playing";

    return c.json({ success: true });
  } catch (error) {
    console.error("Error starting game:", error);
    return c.json({ error: "Failed to start game" }, 500);
  }
});

// Cleanup old lobbies every hour (optional, but good practice)
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
function cleanupOldLobbies() {
  // For now, we'll just log - in a real scenario you might want to track creation time
  // and remove lobbies older than X hours
  console.log(`Active lobbies: ${lobbies.size}`);
}

// Run cleanup every hour
setInterval(cleanupOldLobbies, CLEANUP_INTERVAL_MS);

// Start server
const port = Number(process.env.PORT) || 3000;
const server = serve({ fetch: app.fetch, port });

// Graceful shutdown
const shutdown = () => {
  console.log("Shutting down gracefully...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

console.log(`Server running on port ${port}`);
