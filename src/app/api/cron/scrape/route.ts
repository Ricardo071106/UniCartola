import { NextRequest, NextResponse } from "next/server";
import { spawnNduSyncSubprocess } from "@/lib/ndu/spawn-sync";

export const runtime = "nodejs";
export const maxDuration = 60;

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== "production";

  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.DATABASE_URL?.trim()) {
    return NextResponse.json({ error: "DATABASE_URL não configurada" }, { status: 503 });
  }

  const started = spawnNduSyncSubprocess("api/cron/scrape");

  return NextResponse.json(
    {
      ok: true,
      started,
      message: started
        ? "Sync NDU iniciado em subprocesso"
        : "Sync NDU já em andamento",
    },
    { status: 202 }
  );
}

export async function GET(request: NextRequest) {
  return POST(request);
}
