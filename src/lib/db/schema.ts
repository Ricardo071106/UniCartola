import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const matchStatusEnum = pgEnum("match_status", [
  "scheduled",
  "live",
  "finished",
  "cancelled",
]);

export const predictionResultEnum = pgEnum("prediction_result", [
  "home",
  "draw",
  "away",
]);

export const rankingTypeEnum = pgEnum("ranking_type", [
  "general",
  "weekly",
  "university",
  "course",
  "athletics",
  "historical",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "new_match",
  "ranking_up",
  "top_10",
  "university_lead",
  "achievement",
  "prediction_result",
]);

export const importStatusEnum = pgEnum("import_status", [
  "pending",
  "processing",
  "completed",
  "failed",
]);

export const universities = pgTable("universities", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 200 }).notNull(),
  shortName: varchar("short_name", { length: 20 }).notNull(),
  city: varchar("city", { length: 100 }),
  logoUrl: text("logo_url"),
  totalPoints: integer("total_points").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const courses = pgTable(
  "courses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    universityId: uuid("university_id")
      .references(() => universities.id)
      .notNull(),
    name: varchar("name", { length: 200 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("courses_university_idx").on(t.universityId)]
);

export const athletics = pgTable(
  "athletics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    universityId: uuid("university_id")
      .references(() => universities.id)
      .notNull(),
    name: varchar("name", { length: 200 }).notNull(),
    logoUrl: text("logo_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("athletics_university_idx").on(t.universityId)]
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nickname: varchar("nickname", { length: 50 }).notNull(),
    avatarUrl: text("avatar_url"),
    universityId: uuid("university_id").references(() => universities.id),
    courseId: uuid("course_id").references(() => courses.id),
    athleticsId: uuid("athletics_id").references(() => athletics.id),
    onboardingComplete: boolean("onboarding_complete").default(false).notNull(),
    totalPoints: integer("total_points").default(0).notNull(),
    weeklyPoints: integer("weekly_points").default(0).notNull(),
    correctPredictions: integer("correct_predictions").default(0).notNull(),
    totalPredictions: integer("total_predictions").default(0).notNull(),
    currentStreak: integer("current_streak").default(0).notNull(),
    bestStreak: integer("best_streak").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("users_university_idx").on(t.universityId),
    index("users_weekly_points_idx").on(t.weeklyPoints),
    index("users_total_points_idx").on(t.totalPoints),
  ]
);

export const sports = pgTable("sports", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  icon: varchar("icon", { length: 50 }),
});

export const competitions = pgTable("competitions", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 200 }).notNull(),
  sportId: uuid("sport_id")
    .references(() => sports.id)
    .notNull(),
  description: text("description"),
});

export const seasons = pgTable("seasons", {
  id: uuid("id").primaryKey().defaultRandom(),
  competitionId: uuid("competition_id")
    .references(() => competitions.id)
    .notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  year: integer("year").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const matches = pgTable(
  "matches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    seasonId: uuid("season_id").references(() => seasons.id),
    sportId: uuid("sport_id")
      .references(() => sports.id)
      .notNull(),
    homeUniversityId: uuid("home_university_id")
      .references(() => universities.id)
      .notNull(),
    awayUniversityId: uuid("away_university_id")
      .references(() => universities.id)
      .notNull(),
    modality: varchar("modality", { length: 100 }).notNull(),
    scheduledAt: timestamp("scheduled_at").notNull(),
    venue: varchar("venue", { length: 200 }),
    status: matchStatusEnum("status").default("scheduled").notNull(),
    homeScore: integer("home_score"),
    awayScore: integer("away_score"),
    isFeatured: boolean("is_featured").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("matches_scheduled_idx").on(t.scheduledAt),
    index("matches_status_idx").on(t.status),
    index("matches_sport_idx").on(t.sportId),
  ]
);

export const matchStats = pgTable("match_stats", {
  id: uuid("id").primaryKey().defaultRandom(),
  matchId: uuid("match_id")
    .references(() => matches.id)
    .notNull()
    .unique(),
  goalsHome: integer("goals_home").default(0),
  goalsAway: integer("goals_away").default(0),
  assistsHome: integer("assists_home").default(0),
  assistsAway: integer("assists_away").default(0),
  basketsHome: integer("baskets_home"),
  basketsAway: integer("baskets_away"),
  yellowCardsHome: integer("yellow_cards_home").default(0),
  yellowCardsAway: integer("yellow_cards_away").default(0),
  redCardsHome: integer("red_cards_home").default(0),
  redCardsAway: integer("red_cards_away").default(0),
});

export const predictions = pgTable(
  "predictions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    matchId: uuid("match_id")
      .references(() => matches.id)
      .notNull(),
    result: predictionResultEnum("result").notNull(),
    homeScore: integer("home_score"),
    awayScore: integer("away_score"),
    pointsEarned: integer("points_earned"),
    isScored: boolean("is_scored").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("predictions_user_match_idx").on(t.userId, t.matchId),
    index("predictions_user_idx").on(t.userId),
  ]
);

export const rankings = pgTable(
  "rankings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    type: rankingTypeEnum("type").notNull(),
    scopeId: uuid("scope_id"),
    points: integer("points").notNull(),
    rank: integer("rank").notNull(),
    weekNumber: integer("week_number"),
    periodStart: timestamp("period_start"),
    periodEnd: timestamp("period_end"),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("rankings_type_idx").on(t.type),
    index("rankings_user_idx").on(t.userId),
  ]
);

export const achievements = pgTable("achievements", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 150 }).notNull(),
  description: text("description").notNull(),
  icon: varchar("icon", { length: 50 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  threshold: integer("threshold"),
});

export const userAchievements = pgTable(
  "user_achievements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    achievementId: uuid("achievement_id")
      .references(() => achievements.id)
      .notNull(),
    earnedAt: timestamp("earned_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("user_achievements_unique").on(t.userId, t.achievementId),
  ]
);

export const posts = pgTable(
  "posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    content: text("content").notNull(),
    likesCount: integer("likes_count").default(0).notNull(),
    commentsCount: integer("comments_count").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("posts_created_idx").on(t.createdAt)]
);

export const postLikes = pgTable(
  "post_likes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postId: uuid("post_id")
      .references(() => posts.id)
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("post_likes_unique").on(t.postId, t.userId)]
);

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postId: uuid("post_id")
      .references(() => posts.id)
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("comments_post_idx").on(t.postId)]
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    type: notificationTypeEnum("type").notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    body: text("body").notNull(),
    read: boolean("read").default(false).notNull(),
    metadata: text("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("notifications_user_idx").on(t.userId)]
);

export const matchesImportQueue = pgTable("matches_import_queue", {
  id: uuid("id").primaryKey().defaultRandom(),
  externalId: varchar("external_id", { length: 255 }),
  source: varchar("source", { length: 100 }).notNull(),
  payload: text("payload").notNull(),
  status: importStatusEnum("status").default("pending").notNull(),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
});

export const statisticsImportQueue = pgTable("statistics_import_queue", {
  id: uuid("id").primaryKey().defaultRandom(),
  matchExternalId: varchar("match_external_id", { length: 255 }),
  source: varchar("source", { length: 100 }).notNull(),
  payload: text("payload").notNull(),
  status: importStatusEnum("status").default("pending").notNull(),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
});

export const universitiesRelations = relations(universities, ({ many }) => ({
  courses: many(courses),
  athletics: many(athletics),
  users: many(users),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  university: one(universities, {
    fields: [users.universityId],
    references: [universities.id],
  }),
  course: one(courses, {
    fields: [users.courseId],
    references: [courses.id],
  }),
  athletics: one(athletics, {
    fields: [users.athleticsId],
    references: [athletics.id],
  }),
  predictions: many(predictions),
  posts: many(posts),
  achievements: many(userAchievements),
}));

export const matchesRelations = relations(matches, ({ one, many }) => ({
  homeUniversity: one(universities, {
    fields: [matches.homeUniversityId],
    references: [universities.id],
    relationName: "homeMatches",
  }),
  awayUniversity: one(universities, {
    fields: [matches.awayUniversityId],
    references: [universities.id],
    relationName: "awayMatches",
  }),
  sport: one(sports, {
    fields: [matches.sportId],
    references: [sports.id],
  }),
  stats: one(matchStats),
  predictions: many(predictions),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  user: one(users, { fields: [posts.userId], references: [users.id] }),
  comments: many(comments),
  likes: many(postLikes),
}));
