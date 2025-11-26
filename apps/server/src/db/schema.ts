import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import type { ScriptId, GamePhase } from "@org/types";

export const lobbies = sqliteTable("lobbies", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  script: text("script").$type<ScriptId>().notNull().default("trouble_brewing"),
  phase: text("phase").$type<GamePhase>().notNull().default("setup"),
  playerCount: integer("player_count").notNull(),
  selectedCharacters: text("selected_characters"), // JSON array of character IDs
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const players = sqliteTable("players", {
  id: text("id").primaryKey(),
  lobbyId: text("lobby_id")
    .notNull()
    .references(() => lobbies.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  isStoryteller: integer("is_storyteller", { mode: "boolean" })
    .notNull()
    .default(false),
  characterId: text("character_id"), // Assigned character from script
});

export type Lobby = typeof lobbies.$inferSelect;
export type NewLobby = typeof lobbies.$inferInsert;
export type Player = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;
