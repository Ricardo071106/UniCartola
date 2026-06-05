import { requireDb } from "@/lib/db";
import { universities, courses, athletics } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

export async function getUniversities() {
  const db = requireDb();
  return db.select().from(universities).orderBy(asc(universities.name));
}

export async function getCoursesByUniversity(universityId: string) {
  const db = requireDb();
  return db
    .select()
    .from(courses)
    .where(eq(courses.universityId, universityId))
    .orderBy(asc(courses.name));
}

export async function getAthleticsByUniversity(universityId: string) {
  const db = requireDb();
  return db
    .select()
    .from(athletics)
    .where(eq(athletics.universityId, universityId))
    .orderBy(asc(athletics.name));
}
