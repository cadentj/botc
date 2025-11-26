import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const lobbies = sqliteTable("lobbies", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  script: text("script").notNull().default("trouble_brewing"),
  phase: text("phase").notNull().default("waiting"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const players = sqliteTable("players", {
  id: text("id").primaryKey(),
  lobbyId: text("lobby_id")
    .notNull()
    .references(() => lobbies.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sessionToken: text("session_token").notNull().unique(),
  isStoryteller: integer("is_storyteller", { mode: "boolean" })
    .notNull()
    .default(false),
  connected: integer("connected", { mode: "boolean" })
    .notNull()
    .default(false),
});

export type Lobby = typeof lobbies.$inferSelect;
export type NewLobby = typeof lobbies.$inferInsert;
export type Player = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;

