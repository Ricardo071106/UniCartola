import {
  boolean,
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { schools, courses, athletics } from "./taxonomy";

export const userProfiles = pgTable(
  "user_profiles",
  {
    id: uuid("id").primaryKey(),
    displayName: varchar("display_name", { length: 64 }).notNull(),
    schoolId: uuid("school_id")
      .references(() => schools.id)
      .notNull(),
    courseId: uuid("course_id")
      .references(() => courses.id)
      .notNull(),
    athleticId: uuid("athletic_id")
      .references(() => athletics.id)
      .notNull(),
    onboardingComplete: boolean("onboarding_complete").default(false).notNull(),
    isAdmin: boolean("is_admin").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("user_profiles_school_idx").on(t.schoolId),
    index("user_profiles_course_idx").on(t.courseId),
    index("user_profiles_athletic_idx").on(t.athleticId),
  ]
);
