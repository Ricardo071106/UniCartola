import { spawn } from "child_process";
import path from "path";

let childRunning = false;

/** Roda o sync NDU em subprocesso para não bloquear o servidor web (PDFs pesados). */
export function spawnNduSyncSubprocess(reason: string): boolean {
  if (childRunning) {
    console.log(`[ndu-spawn] Sync já em andamento — ignorando (${reason})`);
    return false;
  }

  const script = path.join(process.cwd(), "scripts/ndu-cron-sync.ts");
  const child = spawn("npx", ["tsx", script], {
    cwd: process.cwd(),
    detached: true,
    stdio: "ignore",
    env: process.env,
  });

  childRunning = true;
  child.unref();

  child.on("exit", (code) => {
    childRunning = false;
    console.log(`[ndu-spawn] Subprocesso encerrou (${reason}) code=${code ?? "?"}`);
  });

  child.on("error", (error) => {
    childRunning = false;
    console.error(`[ndu-spawn] Falha ao iniciar (${reason}):`, error);
  });

  console.log(`[ndu-spawn] Sync iniciado em subprocesso (${reason}) pid=${child.pid}`);
  return true;
}
