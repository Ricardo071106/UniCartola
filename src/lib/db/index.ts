import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import { createPostgresClient, getConnectionConfig } from "./connection";

const config = getConnectionConfig();
const client = config ? createPostgresClient() : null;

export const db = client ? drizzle(client, { schema }) : null;

export function requireDb() {
  if (!db) {
    throw new Error(
      "DATABASE_URL não configurada. Configure a variável de ambiente."
    );
  }
  return db;
}
