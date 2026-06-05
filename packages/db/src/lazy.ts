import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema/index";
import { createPostgresClientResolved, getConnectionString } from "./connection";

export type Database = ReturnType<typeof drizzle<typeof schema>>;

let instance: Database | undefined;
let pending: Promise<Database> | undefined;

export async function getDb(): Promise<Database> {
  if (instance) return instance;
  if (!pending) {
    pending = (async () => {
      const cs = getConnectionString();
      if (!cs) throw new Error("DATABASE_URL is required");
      const client = await createPostgresClientResolved(cs, 10);
      instance = drizzle(client, { schema });
      return instance;
    })();
  }
  return pending;
}
