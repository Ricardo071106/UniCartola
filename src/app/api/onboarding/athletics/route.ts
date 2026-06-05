import { NextRequest, NextResponse } from "next/server";
import { getAthleticsByUniversity } from "@/lib/queries/onboarding";

export async function GET(request: NextRequest) {
  const universityId = request.nextUrl.searchParams.get("universityId");
  if (!universityId) {
    return NextResponse.json({ data: [] });
  }
  try {
    const data = await getAthleticsByUniversity(universityId);
    return NextResponse.json({
      data: data.map((a) => ({ id: a.id, name: a.name })),
    });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
