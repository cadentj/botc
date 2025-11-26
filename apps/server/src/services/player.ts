import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { players } from "../db/schema.js";

export const playerService = {
  findById: async (id: string) => {
    return db.query.players.findFirst({
      where: eq(players.id, id),
    });
  },


  findByLobbyId: async (lobbyId: string) => {
    return db.query.players.findMany({
      where: eq(players.lobbyId, lobbyId),
    });
  },

  create: async (data: {
    id: string;
    lobbyId: string;
    name: string;
    isStoryteller: boolean;
    characterId?: string | null;
  }) => {
    await db.insert(players).values(data);
  },

  updateCharacterId: async (id: string, characterId: string | null) => {
    await db.update(players).set({ characterId }).where(eq(players.id, id));
  },

  delete: async (id: string) => {
    await db.delete(players).where(eq(players.id, id));
  },
};

