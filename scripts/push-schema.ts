import "dotenv/config";
import { execSync } from "node:child_process";
import { logConnectionInfo, connectionHelp } from "../src/lib/db/connection";

if (!process.env.DATABASE_URL?.trim()) {
  console.log("[db] DATABASE_URL não definida — pulando push.");
  process.exit(0);
}

logConnectionInfo();

try {
  execSync("npx drizzle-kit push --force", { stdio: "inherit" });
  console.log("[db] Schema sincronizado.");
} catch (error) {
  console.error("\n" + connectionHelp(error));
  process.exit(1);
}
