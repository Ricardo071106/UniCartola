import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "./schema";

type ScriptDb = PostgresJsDatabase<typeof schema>;

let scriptDbOverride: ScriptDb | null = null;

export function setScriptDbOverride(db: ScriptDb) {
  scriptDbOverride = db;
}

export function clearScriptDbOverride() {
  scriptDbOverride = null;
}

export function getScriptDbOverride(): ScriptDb | null {
  return scriptDbOverride;
}
