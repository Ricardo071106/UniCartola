import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema/index";
import { createPostgresClient, getConnectionString } from "./connection";

const connectionString = getConnectionString();
if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const client = createPostgresClient(connectionString, 10);

export const db = drizzle(client, { schema });
export type Database = typeof db;
