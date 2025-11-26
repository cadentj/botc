import { eq, lt } from "drizzle-orm";
import { db } from "../db/index.js";
import { lobbies } from "../db/schema.js";
import type { GamePhase, ScriptId } from "@org/types";

// 6 hours in milliseconds
const LOBBY_TTL_MS = 6 * 60 * 60 * 1000;

export const lobbyService = {
  findByCode: async (code: string) => {
    return db.query.lobbies.findFirst({
      where: eq(lobbies.code, code),
    });
  },

  findById: async (id: string) => {
    return db.query.lobbies.findFirst({
      where: eq(lobbies.id, id),
    });
  },

  create: async (data: {
    id: string;
    code: string;
    script: ScriptId;
    phase: GamePhase;
    playerCount: number;
    createdAt: Date;
  }) => {
    await db.insert(lobbies).values(data);
  },

  updatePhase: async (id: string, phase: GamePhase) => {
    await db.update(lobbies).set({ phase }).where(eq(lobbies.id, id));
  },

  updateSelectedCharacters: async (id: string, characterIds: string[]) => {
    await db
      .update(lobbies)
      .set({ selectedCharacters: JSON.stringify(characterIds) })
      .where(eq(lobbies.id, id));
  },

  updatePhaseAndCharacters: async (id: string, phase: GamePhase, characterIds: string[]) => {
    await db
      .update(lobbies)
      .set({
        phase,
        selectedCharacters: JSON.stringify(characterIds),
      })
      .where(eq(lobbies.id, id));
  },

  delete: async (id: string) => {
    await db.delete(lobbies).where(eq(lobbies.id, id));
  },

  // Delete all lobbies older than 6 hours
  cleanupOldLobbies: async () => {
    const cutoff = new Date(Date.now() - LOBBY_TTL_MS);
    const result = await db.delete(lobbies).where(lt(lobbies.createdAt, cutoff));
    return result.changes;
  },
};

