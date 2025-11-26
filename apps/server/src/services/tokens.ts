import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "../db/index.js";
import { grimoireTokens } from "../db/schema.js";

export const tokenService = {
  findByLobbyId: async (lobbyId: string) => {
    return db.query.grimoireTokens.findMany({
      where: eq(grimoireTokens.lobbyId, lobbyId),
    });
  },

  create: async (data: {
    lobbyId: string;
    characterId: string;
    positionX: number;
    positionY: number;
    playerId?: string | null;
  }) => {
    await db.insert(grimoireTokens).values({
      id: nanoid(),
      ...data,
    });
  },

  createMany: async (
    tokens: Array<{
      lobbyId: string;
      characterId: string;
      positionX: number;
      positionY: number;
    }>
  ) => {
    await db.insert(grimoireTokens).values(
      tokens.map((token) => ({
        id: nanoid(),
        ...token,
      }))
    );
  },

  updatePosition: async (lobbyId: string, characterId: string, x: number, y: number) => {
    await db
      .update(grimoireTokens)
      .set({ positionX: x, positionY: y })
      .where(and(eq(grimoireTokens.lobbyId, lobbyId), eq(grimoireTokens.characterId, characterId)));
  },

  updatePlayerId: async (lobbyId: string, characterId: string, playerId: string | null) => {
    await db
      .update(grimoireTokens)
      .set({ playerId })
      .where(and(eq(grimoireTokens.lobbyId, lobbyId), eq(grimoireTokens.characterId, characterId)));
  },
};

