import { requireDb } from "../src/lib/db";
import {
  athletics,
  comments,
  courses,
  marketPredictions,
  matchStats,
  matches,
  matchesImportQueue,
  nduScorerStats,
  notifications,
  players,
  postLikes,
  posts,
  predictions,
  rankings,
  scrapeRuns,
  seasons,
  statisticsImportQueue,
  teamMappingQueue,
  universities,
  userAchievements,
  users,
} from "../src/lib/db/schema";
import {
  and,
  desc,
  eq,
  inArray,
  isNotNull,
  isNull,
  like,
  ne,
  notInArray,
  or,
  sql,
} from "drizzle-orm";
import { getCurrentStatsYear } from "../src/lib/ndu/stats-period";

export const SEED_UNIVERSITY_SHORT_NAMES = [
  "FEI",
  "Mackenzie",
  "Mauá",
  "Poli-USP",
  "UNICAMP",
  "UNESP",
  "UFMG",
  "UFRJ",
  "UFPR",
  "UFSC",
  "PUC-Rio",
  "PUC-SP",
  "ITA",
  "FGV",
  "Insper",
  "ESPM",
  "UFBA",
  "UFC",
  "UFRGS",
  "UNIFESP",
] as const;

function isDemoUserWhere() {
  return and(
    like(users.nickname, "jogador_%"),
    or(isNull(users.email), eq(users.email, "")),
    or(isNull(users.passwordHash), eq(users.passwordHash, "")),
    like(users.avatarUrl, "%dicebear%avataaars%")
  )!;
}

function isDemoMatchWhere() {
  return or(
    like(matches.externalKey, "seed:%"),
    like(matches.externalKey, "demo:%"),
    isNull(matches.externalKey)
  )!;
}

export async function getCleanupCounts(db: ReturnType<typeof requireDb>) {
  const activeYear = await getCurrentStatsYear();
  const demoUserIds = (
    await db.select({ id: users.id }).from(users).where(isDemoUserWhere())
  ).map((r) => r.id);
  const demoUniIds = (
    await db
      .select({ id: universities.id })
      .from(universities)
      .where(inArray(universities.shortName, [...SEED_UNIVERSITY_SHORT_NAMES]))
  ).map((r) => r.id);
  const demoMatchIds = (
    await db.select({ id: matches.id }).from(matches).where(isDemoMatchWhere())
  ).map((r) => r.id);

  const [realUsers] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users)
    .where(demoUserIds.length ? notInArray(users.id, demoUserIds) : sql`true`);

  const [oldStats] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(nduScorerStats)
    .where(ne(nduScorerStats.seasonYear, activeYear));

  const [demoAthletics] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(athletics)
    .where(
      and(
        isNull(athletics.nduAthleticId),
        demoUniIds.length
          ? inArray(athletics.universityId, demoUniIds)
          : sql`false`
      )
    );

  const [nduMatches] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(matches)
    .where(
      demoMatchIds.length ? notInArray(matches.id, demoMatchIds) : sql`true`
    );

  return {
    activeYear,
    demoUserIds,
    demoUniIds,
    demoMatchIds,
    realUsers: realUsers?.count ?? 0,
    oldStats: oldStats?.count ?? 0,
    demoAthletics: demoAthletics?.count ?? 0,
    nduMatches: nduMatches?.count ?? 0,
  };
}

/** Remove demo seed data; preserves real users and NDU-synced records. */
export async function cleanupDemoData(db: ReturnType<typeof requireDb>) {
  const activeYear = await getCurrentStatsYear();
  const { demoUserIds, demoUniIds, demoMatchIds } = await getCleanupCounts(db);

  if (demoUserIds.length) {
    await db.delete(predictions).where(inArray(predictions.userId, demoUserIds));
    await db
      .delete(marketPredictions)
      .where(inArray(marketPredictions.userId, demoUserIds));
    await db.delete(rankings).where(inArray(rankings.userId, demoUserIds));
    await db
      .delete(userAchievements)
      .where(inArray(userAchievements.userId, demoUserIds));
    await db
      .delete(notifications)
      .where(inArray(notifications.userId, demoUserIds));
    await db.delete(postLikes).where(inArray(postLikes.userId, demoUserIds));
    await db.delete(comments).where(inArray(comments.userId, demoUserIds));
    await db.delete(posts).where(inArray(posts.userId, demoUserIds));
    const removedUsers = await db
      .delete(users)
      .where(inArray(users.id, demoUserIds))
      .returning({ id: users.id });
    console.log(`[cleanup] Removidos ${removedUsers.length} usuários demo`);
  }

  if (demoMatchIds.length) {
    await db
      .delete(predictions)
      .where(inArray(predictions.matchId, demoMatchIds));
    await db.delete(matchStats).where(inArray(matchStats.matchId, demoMatchIds));
    const removedMatches = await db
      .delete(matches)
      .where(inArray(matches.id, demoMatchIds))
      .returning({ id: matches.id });
    console.log(
      `[cleanup] Removidos ${removedMatches.length} jogos demo/órfãos`
    );
  }

  const removedStats = await db
    .delete(nduScorerStats)
    .where(ne(nduScorerStats.seasonYear, activeYear))
    .returning({ id: nduScorerStats.id });
  if (removedStats.length) {
    console.log(
      `[cleanup] Removidas ${removedStats.length} estatísticas fora de ${activeYear}`
    );
  }

  await db.delete(players);
  await db.delete(matchesImportQueue);
  await db.delete(statisticsImportQueue);

  const keepScrapeRuns = await db
    .select({ id: scrapeRuns.id })
    .from(scrapeRuns)
    .orderBy(desc(scrapeRuns.startedAt))
    .limit(20);
  const keepIds = keepScrapeRuns.map((r) => r.id);
  if (keepIds.length) {
    await db
      .delete(scrapeRuns)
      .where(notInArray(scrapeRuns.id, keepIds));
  }

  if (demoUniIds.length) {
    const [nduPlaceholder] = await db
      .select()
      .from(universities)
      .where(eq(universities.shortName, "NDU"))
      .limit(1);
    const fallbackUni =
      nduPlaceholder ??
      (
        await db
          .select()
          .from(universities)
          .where(notInArray(universities.id, demoUniIds))
          .limit(1)
      )[0];

    if (fallbackUni) {
      const movedAth = await db
        .update(athletics)
        .set({ universityId: fallbackUni.id })
        .where(
          and(
            inArray(athletics.universityId, demoUniIds),
            isNotNull(athletics.nduAthleticId)
          )
        )
        .returning({ id: athletics.id });
      if (movedAth.length) {
        console.log(
          `[cleanup] ${movedAth.length} atlética(s) NDU movida(s) para ${fallbackUni.shortName}`
        );
      }

      const movedHome = await db
        .update(matches)
        .set({ homeUniversityId: fallbackUni.id })
        .where(inArray(matches.homeUniversityId, demoUniIds))
        .returning({ id: matches.id });
      const movedAway = await db
        .update(matches)
        .set({ awayUniversityId: fallbackUni.id })
        .where(inArray(matches.awayUniversityId, demoUniIds))
        .returning({ id: matches.id });
      if (movedHome.length || movedAway.length) {
        console.log(
          `[cleanup] Jogos NDU reassociados à universidade ${fallbackUni.shortName}`
        );
      }
    }

    const realUsersOnDemoUni = await db
      .select({ id: users.id })
      .from(users)
      .where(inArray(users.universityId, demoUniIds));
    if (realUsersOnDemoUni.length) {
      await db
        .update(users)
        .set({
          universityId: null,
          courseId: null,
          athleticsId: null,
          onboardingComplete: false,
        })
        .where(inArray(users.universityId, demoUniIds));
      console.log(
        `[cleanup] ${realUsersOnDemoUni.length} usuário(s) real(is) desvinculado(s) de universidades demo`
      );
    }

    const demoAthleticRows = await db
      .select({ id: athletics.id })
      .from(athletics)
      .where(
        and(
          isNull(athletics.nduAthleticId),
          inArray(athletics.universityId, demoUniIds)
        )
      );
    const demoAthleticIds = demoAthleticRows.map((r) => r.id);

    if (demoAthleticIds.length) {
      await db
        .update(users)
        .set({ athleticsId: null })
        .where(inArray(users.athleticsId, demoAthleticIds));
      await db
        .delete(teamMappingQueue)
        .where(inArray(teamMappingQueue.suggestedAthleticsId, demoAthleticIds));
      await db
        .delete(marketPredictions)
        .where(inArray(marketPredictions.athleticsId, demoAthleticIds));
      const removedAth = await db
        .delete(athletics)
        .where(inArray(athletics.id, demoAthleticIds))
        .returning({ id: athletics.id });
      console.log(`[cleanup] Removidas ${removedAth.length} atléticas demo`);
    }

    const demoCourseRows = await db
      .select({ id: courses.id })
      .from(courses)
      .where(inArray(courses.universityId, demoUniIds));
    const demoCourseIds = demoCourseRows.map((r) => r.id);
    if (demoCourseIds.length) {
      await db
        .update(users)
        .set({ courseId: null })
        .where(inArray(users.courseId, demoCourseIds));
    }

    const removedCourses = await db
      .delete(courses)
      .where(inArray(courses.universityId, demoUniIds))
      .returning({ id: courses.id });
    if (removedCourses.length) {
      console.log(`[cleanup] Removidos ${removedCourses.length} cursos demo`);
    }

    const removedUnis = await db
      .delete(universities)
      .where(inArray(universities.id, demoUniIds))
      .returning({ id: universities.id });
    if (removedUnis.length) {
      console.log(`[cleanup] Removidas ${removedUnis.length} universidades demo`);
    }
  }

  const [nduUni] = await db
    .select()
    .from(universities)
    .where(eq(universities.shortName, "NDU"))
    .limit(1);
  if (!nduUni) {
    await db.insert(universities).values({
      name: "NDU — Times Universitários",
      shortName: "NDU",
      city: "São Paulo",
    });
    console.log("[cleanup] Universidade placeholder NDU recriada");
  }

  const [activeSeason] = await db
    .select()
    .from(seasons)
    .where(eq(seasons.isActive, true))
    .limit(1);
  if (!activeSeason) {
    console.warn("[cleanup] Nenhuma temporada ativa encontrada");
  }
}
