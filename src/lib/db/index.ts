import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import { createPostgresClient } from "./connection";

let client: ReturnType<typeof createPostgresClient> | null = null;

try {
  if (process.env.DATABASE_URL?.trim()) {
    client = createPostgresClient();
  }
} catch {
  client = null;
}

export const db = client ? drizzle(client, { schema }) : null;

export function requireDb() {
  if (!db) {
    throw new Error("DATABASE_URL não configurada.");
  }
  return db;
}
