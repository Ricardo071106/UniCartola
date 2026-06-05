import { defineConfig } from "drizzle-kit";
import "dotenv/config";
import { getConnectionString } from "./src/lib/db/connection";

const url = getConnectionString();

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: url ?? "",
  },
});
