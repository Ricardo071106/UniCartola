import { NextResponse } from "next/server";
import { getUniversities } from "@/lib/queries/onboarding";

export async function GET() {
  try {
    const data = await getUniversities();
    return NextResponse.json({
      data: data.map((u) => ({
        id: u.id,
        name: u.name,
        shortName: u.shortName,
        city: u.city,
      })),
    });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
