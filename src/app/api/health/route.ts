import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    database: "removed",
    message: "Banco removido — plataforma em redesign",
  });
}
