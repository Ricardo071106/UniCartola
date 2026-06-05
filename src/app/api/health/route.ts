import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (db) {
      await db.execute(sql`select 1`);
      return NextResponse.json({ status: "ok", database: "connected" });
    }
    return NextResponse.json({ status: "ok", database: "not_configured" });
  } catch {
    return NextResponse.json(
      { status: "error", database: "disconnected" },
      { status: 503 }
    );
  }
}
