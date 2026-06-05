import { NextRequest, NextResponse } from "next/server";
import { getCoursesByUniversity } from "@/lib/queries/onboarding";

export async function GET(request: NextRequest) {
  const universityId = request.nextUrl.searchParams.get("universityId");
  if (!universityId) {
    return NextResponse.json({ data: [] });
  }
  try {
    const data = await getCoursesByUniversity(universityId);
    return NextResponse.json({
      data: data.map((c) => ({ id: c.id, name: c.name })),
    });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
