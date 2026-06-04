import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { schools, courses, athletics } from "@unicartola/db/schema";

export async function GET() {
  const [schoolRows, courseRows, athleticRows] = await Promise.all([
    db.select().from(schools).orderBy(schools.name),
    db.select().from(courses).orderBy(courses.name),
    db.select().from(athletics).orderBy(athletics.name),
  ]);

  return NextResponse.json({
    schools: schoolRows,
    courses: courseRows,
    athletics: athleticRows,
  });
}
