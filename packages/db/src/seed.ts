import { getDb } from "./client";
import {
  schools,
  courses,
  athletics,
  competitions,
  modalities,
  achievements,
  teams,
  matches,
  userProfiles,
  pointsLedger,
  posts,
  comments,
  notifications,
  userAchievements,
  matchStats,
  matchesImportQueue,
  statisticsImportQueue,
} from "./schema/index";
import { eq } from "drizzle-orm";

function normalizeTeamName(name: string) {
  return name.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ");
}

function slugify(name: string) {
  return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

const SCHOOL_NAMES = [
  "FEI", "Mackenzie", "Insper", "FGV", "Mauá", "ESPM", "FEA USP", "Poli USP",
  "Medicina USP", "PUC SP", "ITA", "Einstein", "Anhembi Morumbi", "FAAP",
  "IBMEC SP", "UNIFESP", "UFABC", "UNINOVE", "Belas Artes", "São Judas",
];

const COURSE_NAMES = [
  "Engenharia", "Administração", "Medicina", "Direito", "Economia",
  "Ciências da Computação", "Arquitetura", "Comunicação", "Psicologia", "Educação Física",
];

const NICKNAMES = ["Palpiteiro", "Cravador", "Mestre", "Lenda", "Profeta", "Campeão", "Atleta", "Torcedor"];

const ACHIEVEMENTS = [
  { code: "first_prediction", title: "Primeiro Palpite", description: "Fez seu primeiro palpite", icon: "target" },
  { code: "streak_10", title: "10 Acertos Seguidos", description: "10 acertos consecutivos", icon: "flame" },
  { code: "games_50", title: "50 Jogos", description: "Palpitou em 50 jogos", icon: "medal" },
  { code: "games_100", title: "100 Jogos", description: "Palpitou em 100 jogos", icon: "trophy" },
  { code: "school_top_10", title: "Top 10 Faculdade", description: "Top 10 da faculdade", icon: "school" },
  { code: "weekly_top", title: "Melhor da Semana", description: "Liderou ranking semanal", icon: "crown" },
  { code: "futsal_specialist", title: "Especialista em Futsal", description: "80%+ acerto futsal", icon: "soccer" },
  { code: "basket_specialist", title: "Especialista em Basquete", description: "80%+ acerto basquete", icon: "basketball" },
  { code: "football_specialist", title: "Especialista em Futebol", description: "80%+ acerto futebol", icon: "football" },
];

async function seed() {
  const db = await getDb();
  console.log("Seeding Campus League database...");

  for (const name of SCHOOL_NAMES) {
    await db.insert(schools).values({ name, slug: slugify(name), shortName: name }).onConflictDoNothing({ target: schools.slug });
  }

  for (const name of COURSE_NAMES) {
    await db.insert(courses).values({ name, slug: slugify(name) }).onConflictDoNothing({ target: courses.slug });
  }

  const schoolRows = await db.select().from(schools);
  const courseRows = await db.select().from(courses);

  for (const s of schoolRows) {
    await db.insert(athletics).values({
      name: `Atlética ${s.shortName ?? s.name}`,
      slug: slugify(`atletica-${s.shortName ?? s.name}`),
      schoolId: s.id,
    }).onConflictDoNothing({ target: athletics.slug });
  }

  const athleticRows = await db.select().from(athletics);

  const [comp] = await db.insert(competitions).values({
    name: "Campus League 2026 — 1º Semestre",
    slug: "campus-league-2026-1",
    season: "2026",
    semester: "1",
    isActive: true,
  }).onConflictDoNothing({ target: competitions.slug }).returning();

  let competition = comp;
  if (!competition) {
    const existing = await db.select().from(competitions).where(eq(competitions.slug, "campus-league-2026-1")).limit(1);
    competition = existing[0];
  }

  if (!competition) {
    console.log("No competition created.");
    process.exit(0);
  }

  const modalityDefs = [
    { name: "Futsal Masculino", slug: "futsal-masculino", gender: "M" },
    { name: "Futsal Feminino", slug: "futsal-feminino", gender: "F" },
    { name: "Futebol Masculino", slug: "futebol-masculino", gender: "M" },
    { name: "Basquete Masculino", slug: "basquete-masculino", gender: "M" },
    { name: "Basquete Feminino", slug: "basquete-feminino", gender: "F" },
    { name: "Vôlei Masculino", slug: "volei-masculino", gender: "M" },
  ];

  for (const m of modalityDefs) {
    await db.insert(modalities).values({ competitionId: competition.id, ...m, isMvpEnabled: true }).onConflictDoNothing();
  }

  const modRows = await db.select().from(modalities).where(eq(modalities.competitionId, competition.id));

  for (const a of ACHIEVEMENTS) {
    await db.insert(achievements).values(a).onConflictDoNothing();
  }

  const teamIds: string[] = [];
  for (const s of schoolRows) {
    const norm = normalizeTeamName(s.shortName ?? s.name);
    const [existing] = await db.select().from(teams).where(eq(teams.normalizedName, norm)).limit(1);
    if (existing) {
      teamIds.push(existing.id);
    } else {
      const [created] = await db.insert(teams).values({
        name: s.shortName ?? s.name,
        normalizedName: norm,
        schoolId: s.id,
      }).returning();
      teamIds.push(created.id);
    }
  }

  console.log("Creating 200 matches...");
  for (let i = 0; i < 200; i++) {
    const homeIdx = i % teamIds.length;
    const awayIdx = (i * 3 + 1) % teamIds.length;
    const mod = modRows[i % modRows.length];
    const daysOffset = i < 8 ? i - 2 : i < 16 ? 0 : i < 40 ? Math.floor(i / 8) : -(i % 30);
    const scheduledAt = new Date();
    scheduledAt.setDate(scheduledAt.getDate() + daysOffset);
    scheduledAt.setHours(10 + (i % 10), (i % 4) * 15, 0, 0);

    let status: "scheduled" | "live" | "finished" = "scheduled";
    let homeScore: number | null = null;
    let awayScore: number | null = null;

    if (daysOffset < 0) {
      status = "finished";
      homeScore = Math.floor(seededRandom(i) * 6);
      awayScore = Math.floor(seededRandom(i + 1) * 6);
    } else if (daysOffset === 0 && i % 7 === 0) {
      status = "live";
      homeScore = Math.floor(seededRandom(i) * 4);
      awayScore = Math.floor(seededRandom(i + 1) * 4);
    }

    await db.insert(matches).values({
      competitionId: competition.id,
      modalityId: mod.id,
      homeTeamId: teamIds[homeIdx],
      awayTeamId: teamIds[awayIdx === homeIdx ? (awayIdx + 1) % teamIds.length : awayIdx],
      series: ["A", "B", "C"][i % 3],
      groupName: ["A", "B"][i % 2],
      scheduledAt,
      status,
      homeScore,
      awayScore,
      venue: `Ginásio ${schoolRows[homeIdx]?.shortName ?? "Campus"}`,
      externalKey: `seed:match-${i}`,
      predictionsOpen: status === "scheduled",
    }).onConflictDoNothing({ target: matches.externalKey });
  }

  console.log("Creating 100 users...");
  const achievementRows = await db.select().from(achievements);

  for (let i = 0; i < 100; i++) {
    const userId = crypto.randomUUID();
    const school = schoolRows[i % schoolRows.length];
    const course = courseRows[i % courseRows.length];
    const athletic = athleticRows.find((a) => a.schoolId === school.id) ?? athleticRows[0];

    await db.insert(userProfiles).values({
      id: userId,
      displayName: `${NICKNAMES[i % NICKNAMES.length]}${i + 1}`,
      schoolId: school.id,
      courseId: course.id,
      athleticId: athletic.id,
      onboardingComplete: true,
    }).onConflictDoNothing();

    const points = Math.floor(seededRandom(i) * 200);
    if (points > 0) {
      await db.insert(pointsLedger).values({
        userId,
        competitionId: competition.id,
        source: "match_prediction",
        points,
        idempotencyKey: `seed:points:${userId}`,
        description: "Seed points",
      }).onConflictDoNothing();
    }

    for (let a = 0; a < 2 + (i % 3); a++) {
      const ach = achievementRows[a % achievementRows.length];
      if (ach) {
        await db.insert(userAchievements).values({ userId, achievementId: ach.id }).onConflictDoNothing();
      }
    }
  }

  const userRows = await db.select().from(userProfiles).limit(30);
  const matchRows = await db.select().from(matches).limit(25);

  console.log("Creating community feed...");
  for (let i = 0; i < 25; i++) {
    const user = userRows[i % userRows.length];
    const [post] = await db.insert(posts).values({
      userId: user.id,
      content: `${schoolRows[i % schoolRows.length].shortName} vai dominar essa rodada!`,
    }).returning();

    if (post && i % 3 === 0) {
      await db.insert(comments).values({
        postId: post.id,
        userId: userRows[(i + 1) % userRows.length].id,
        content: "Concordo totalmente!",
      });
    }
  }

  if (userRows[0]) {
    await db.insert(notifications).values([
      { userId: userRows[0].id, type: "match_reminder", title: "Jogo em breve", body: "Seu jogo começa em 2 horas.", read: false },
      { userId: userRows[0].id, type: "rank_up", title: "Subiu no ranking", body: "Você subiu para o 3º lugar.", read: false },
    ]);
  }

  const finishedMatches = await db.select().from(matches).where(eq(matches.status, "finished")).limit(20);
  for (const m of finishedMatches) {
    await db.insert(matchStats).values({
      matchId: m.id,
      goals: [{ player: "João Silva", team: "Home", minute: 15 }],
      cards: [{ player: "Pedro", team: "Away", type: "yellow" }],
      topScorers: [{ player: "João Silva", team: "Home", count: 2 }],
    }).onConflictDoNothing();
  }

  await db.insert(matchesImportQueue).values({
    source: "ndu",
    externalKey: "demo:pending-match",
    payload: { home: "FEI", away: "Mauá", modality: "futsal-masculino" },
    status: "pending",
  }).onConflictDoNothing();

  await db.insert(statisticsImportQueue).values({
    source: "ndu",
    matchExternalKey: "demo:pending-match",
    payload: { stats: "pending" },
    status: "pending",
  }).onConflictDoNothing();

  console.log("Seed completed — Campus League ready.");
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
