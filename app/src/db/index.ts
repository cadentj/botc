import Database, { type Database as DatabaseType } from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema.js";
import { dirname, join } from "node:path";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use /data/botc.db on Fly.io, or local file in development
const dbPath =
  process.env.DATABASE_URL || join(__dirname, "../../../data/botc.db");

// Ensure directory exists
mkdirSync(dirname(dbPath), { recursive: true });

const sqlite: DatabaseType = new Database(dbPath);

export const db = drizzle(sqlite, { schema });

export { sqlite };
