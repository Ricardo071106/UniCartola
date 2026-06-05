import { defineConfig } from "drizzle-kit";
import "dotenv/config";

const url = process.env.DATABASE_URL?.trim() ?? "";

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
});
