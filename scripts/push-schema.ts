import "dotenv/config";
import { execSync } from "node:child_process";
import {
  getConnectionString,
  logConnectionPreview,
  supabaseConnectionHelp,
} from "../src/lib/db/connection";

const url = getConnectionString();

if (!url) {
  console.log("[db] DATABASE_URL não definida — pulando push.");
  process.exit(0);
}

logConnectionPreview(url);

try {
  execSync("npx drizzle-kit push --force", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: url },
  });
  console.log("[db] Schema sincronizado.");
} catch (error) {
  console.error("\n" + supabaseConnectionHelp(error));
  process.exit(1);
}
