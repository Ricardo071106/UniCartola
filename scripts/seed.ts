import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

const UNIVERSITIES = [
  { name: "Centro Universitário FEI", shortName: "FEI", city: "São Bernardo do Campo" },
  { name: "Universidade Presbiteriana Mackenzie", shortName: "Mackenzie", city: "São Paulo" },
  { name: "Instituto Mauá de Tecnologia", shortName: "Mauá", city: "São Caetano" },
  { name: "Escola Politécnica - USP", shortName: "Poli-USP", city: "São Paulo" },
  { name: "UNICAMP", shortName: "UNICAMP", city: "Campinas" },
  { name: "UNESP", shortName: "UNESP", city: "São Paulo" },
  { name: "UFMG", shortName: "UFMG", city: "Belo Horizonte" },
  { name: "UFRJ", shortName: "UFRJ", city: "Rio de Janeiro" },
  { name: "UFPR", shortName: "UFPR", city: "Curitiba" },
  { name: "UFSC", shortName: "UFSC", city: "Florianópolis" },
  { name: "PUC-Rio", shortName: "PUC-Rio", city: "Rio de Janeiro" },
  { name: "PUC-SP", shortName: "PUC-SP", city: "São Paulo" },
  { name: "ITA", shortName: "ITA", city: "São José dos Campos" },
  { name: "FGV", shortName: "FGV", city: "São Paulo" },
  { name: "Insper", shortName: "Insper", city: "São Paulo" },
  { name: "ESPM", shortName: "ESPM", city: "São Paulo" },
  { name: "UFBA", shortName: "UFBA", city: "Salvador" },
  { name: "UFC", shortName: "UFC", city: "Fortaleza" },
  { name: "UFRGS", shortName: "UFRGS", city: "Porto Alegre" },
  { name: "UNIFESP", shortName: "UNIFESP", city: "São Paulo" },
];

const COURSE_NAMES = [
  "Engenharia de Computação",
  "Engenharia Mecânica",
  "Engenharia Civil",
  "Engenharia Elétrica",
  "Administração",
  "Direito",
  "Medicina",
  "Arquitetura",
  "Ciência da Computação",
  "Sistemas de Informação",
  "Economia",
  "Design",
  "Psicologia",
  "Jornalismo",
  "Publicidade",
];

const ATHLETICS_NAMES = [
  "Atlética FEI",
  "Atlética Mackenzie",
  "Atlética Mauá",
  "Atlética Poli",
  "Atlética Unicamp",
  "Atlética Unesp",
  "Atlética UFMG",
  "Atlética UFRJ",
  "Atlética UFPR",
  "Atlética UFSC",
  "Atlética PUC",
  "Atlética ITA",
  "Atlética FGV",
  "Atlética Insper",
  "Atlética ESPM",
  "Atlética UFBA",
  "Atlética UFC",
  "Atlética UFRGS",
  "Atlética UNIFESP",
  "Atlética Geral",
  "Atlética dos Bixos",
  "Atlética Veteranos",
  "Atlética Esportes",
  "Atlética Integração",
  "Atlética Campeões",
  "Atlética Invictus",
  "Atlética Spartans",
  "Atlética Warriors",
  "Atlética Lions",
  "Atlética Eagles",
];

const ACHIEVEMENTS = [
  { slug: "first_prediction", name: "Primeiro Palpite", description: "Fez seu primeiro palpite", icon: "target", category: "predictions", threshold: 1 },
  { slug: "10_games", name: "10 Jogos", description: "Palpitou em 10 jogos", icon: "medal", category: "predictions", threshold: 10 },
  { slug: "50_games", name: "50 Jogos", description: "Palpitou em 50 jogos", icon: "trophy", category: "predictions", threshold: 50 },
  { slug: "100_games", name: "100 Jogos", description: "Palpitou em 100 jogos", icon: "star", category: "predictions", threshold: 100 },
  { slug: "streak_10", name: "10 Acertos Seguidos", description: "Acertou 10 palpites seguidos", icon: "flame", category: "streak", threshold: 10 },
  { slug: "top_10_university", name: "Top 10 Faculdade", description: "Entrou no top 10 da sua faculdade", icon: "trophy", category: "ranking", threshold: 10 },
  { slug: "best_week", name: "Melhor da Semana", description: "Liderou o ranking semanal", icon: "award", category: "ranking", threshold: 1 },
  { slug: "football_expert", name: "Especialista em Futebol", description: "Alto desempenho em futebol", icon: "target", category: "sport", threshold: 20 },
  { slug: "futsal_expert", name: "Especialista em Futsal", description: "Alto desempenho em futsal", icon: "zap", category: "sport", threshold: 20 },
  { slug: "basketball_expert", name: "Especialista em Basquete", description: "Alto desempenho em basquete", icon: "star", category: "sport", threshold: 20 },
];

const POST_SAMPLES = [
  "Hoje a FEI leva essa. Sem discussão!",
  "Mauá x Mackenzie vai ser tenso. Quem palpita empate?",
  "Basquete da atlética ontem foi insano.",
  "Nossa faculdade precisa subir no ranking semanal!",
  "Futsal feminino da UNICAMP é forte demais.",
  "Palpite do dia: visitante surpreende.",
  "Que jogão no ginásio principal!",
  "Atlética representando pesado esse semestre.",
];

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[rand(0, arr.length - 1)];
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const client = postgres(url, { max: 1 });
  const db = drizzle(client, { schema });

  console.log("🌱 Seeding Campus League...");

  // Clear data (order matters for FK)
  await db.delete(schema.postLikes);
  await db.delete(schema.comments);
  await db.delete(schema.posts);
  await db.delete(schema.notifications);
  await db.delete(schema.userAchievements);
  await db.delete(schema.rankings);
  await db.delete(schema.predictions);
  await db.delete(schema.matchStats);
  await db.delete(schema.matches);
  await db.delete(schema.seasons);
  await db.delete(schema.competitions);
  await db.delete(schema.users);
  await db.delete(schema.athletics);
  await db.delete(schema.courses);
  await db.delete(schema.achievements);
  await db.delete(schema.sports);
  await db.delete(schema.universities);
  await db.delete(schema.matchesImportQueue);
  await db.delete(schema.statisticsImportQueue);

  const uniRows = await db
    .insert(schema.universities)
    .values(
      UNIVERSITIES.map((u) => ({
        ...u,
        totalPoints: rand(500, 5000),
      }))
    )
    .returning();

  const courseValues: (typeof schema.courses.$inferInsert)[] = [];
  uniRows.forEach((uni, i) => {
    const count = i < 10 ? 3 : 2;
    for (let j = 0; j < count; j++) {
      courseValues.push({
        universityId: uni.id,
        name: `${pick(COURSE_NAMES)} — ${uni.shortName}`,
      });
    }
  });
  const courseRows = await db.insert(schema.courses).values(courseValues).returning();

  const athleticsValues: (typeof schema.athletics.$inferInsert)[] = [];
  uniRows.forEach((uni, i) => {
    athleticsValues.push({
      universityId: uni.id,
      name: ATHLETICS_NAMES[i] ?? `Atlética ${uni.shortName}`,
    });
    if (i % 2 === 0) {
      athleticsValues.push({
        universityId: uni.id,
        name: `Atlética ${uni.shortName} B`,
      });
    }
  });
  const athleticsRows = await db.insert(schema.athletics).values(athleticsValues).returning();

  const sportRows = await db
    .insert(schema.sports)
    .values([
      { name: "Futebol", slug: "futebol", icon: "ball" },
      { name: "Futsal", slug: "futsal", icon: "ball" },
      { name: "Basquete", slug: "basquete", icon: "basket" },
    ])
    .returning();

  const comp = await db
    .insert(schema.competitions)
    .values([
      { name: "Jogos Universitários SP", sportId: sportRows[0].id },
      { name: "Liga Futsal Universitária", sportId: sportRows[1].id },
      { name: "Copa Basquete Campus", sportId: sportRows[2].id },
    ])
    .returning();

  const season = await db
    .insert(schema.seasons)
    .values({
      competitionId: comp[0].id,
      name: "2026.1",
      year: 2026,
      isActive: true,
    })
    .returning();

  await db.insert(schema.achievements).values(ACHIEVEMENTS);

  const modalities = [
    "Futebol Masculino",
    "Futebol Feminino",
    "Futsal Masculino",
    "Futsal Feminino",
    "Basquete Masculino",
    "Basquete Feminino",
  ];

  const matchValues: (typeof schema.matches.$inferInsert)[] = [];
  const now = new Date();

  for (let i = 0; i < 200; i++) {
    const home = pick(uniRows);
    let away = pick(uniRows);
    while (away.id === home.id) away = pick(uniRows);
    const sport = pick(sportRows);
    const daysOffset = rand(-30, 14);
    const scheduled = new Date(now);
    scheduled.setDate(scheduled.getDate() + daysOffset);
    scheduled.setHours(rand(8, 22), rand(0, 1) * 30, 0, 0);

    let status: "scheduled" | "live" | "finished" = "scheduled";
    let homeScore: number | null = null;
    let awayScore: number | null = null;

    if (daysOffset < 0) {
      status = "finished";
      homeScore = rand(0, 5);
      awayScore = rand(0, 5);
    } else if (daysOffset === 0 && rand(0, 10) > 7) {
      status = "live";
      homeScore = rand(0, 3);
      awayScore = rand(0, 3);
    }

    matchValues.push({
      seasonId: season[0].id,
      sportId: sport.id,
      homeUniversityId: home.id,
      awayUniversityId: away.id,
      modality: pick(modalities),
      scheduledAt: scheduled,
      venue: `Ginásio ${pick(["Principal", "Arena", "Poliesportivo", "Campus Norte"])} — ${home.shortName}`,
      status,
      homeScore,
      awayScore,
      isFeatured: i === 0,
    });
  }

  const matchRows = await db.insert(schema.matches).values(matchValues).returning();

  const statsValues = matchRows
    .filter((m) => m.status === "finished")
    .map((m) => ({
      matchId: m.id,
      goalsHome: m.homeScore ?? 0,
      goalsAway: m.awayScore ?? 0,
      assistsHome: rand(0, 5),
      assistsAway: rand(0, 5),
      basketsHome: m.modality.includes("Basquete") ? rand(40, 90) : null,
      basketsAway: m.modality.includes("Basquete") ? rand(40, 90) : null,
      yellowCardsHome: rand(0, 3),
      yellowCardsAway: rand(0, 3),
      redCardsHome: rand(0, 1),
      redCardsAway: rand(0, 1),
    }));

  if (statsValues.length) {
    await db.insert(schema.matchStats).values(statsValues);
  }

  const userValues = Array.from({ length: 100 }, (_, i) => {
    const uni = pick(uniRows);
    const uniCourses = courseRows.filter((c) => c.universityId === uni.id);
    const uniAthletics = athleticsRows.filter((a) => a.universityId === uni.id);
    const nickname = `jogador_${uni.shortName.toLowerCase().replace(/\W/g, "")}_${i + 1}`;
    return {
      nickname,
      universityId: uni.id,
      courseId: pick(uniCourses).id,
      athleticsId: pick(uniAthletics).id,
      onboardingComplete: true,
      totalPoints: rand(10, 800),
      weeklyPoints: rand(0, 150),
      correctPredictions: rand(5, 80),
      totalPredictions: rand(20, 120),
      currentStreak: rand(0, 12),
      bestStreak: rand(3, 15),
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${nickname}`,
    };
  });

  const userRows = await db.insert(schema.users).values(userValues).returning();

  const achievementRows = await db.select().from(schema.achievements);
  const finishedMatches = matchRows.filter((m) => m.status === "finished");

  for (const user of userRows) {
    const numPredictions = rand(5, 25);
    const selectedMatches = [...finishedMatches]
      .sort(() => Math.random() - 0.5)
      .slice(0, numPredictions);

    for (const match of selectedMatches) {
      const results = ["home", "draw", "away"] as const;
      const result = pick([...results]);
      const points = rand(0, 8);
      await db.insert(schema.predictions).values({
        userId: user.id,
        matchId: match.id,
        result,
        homeScore: rand(0, 1) ? match.homeScore : null,
        awayScore: rand(0, 1) ? match.awayScore : null,
        pointsEarned: points,
        isScored: true,
      });
    }

    const earnedCount = rand(1, 5);
    const shuffled = [...achievementRows].sort(() => Math.random() - 0.5);
    for (let i = 0; i < earnedCount; i++) {
      await db.insert(schema.userAchievements).values({
        userId: user.id,
        achievementId: shuffled[i].id,
      });
    }

    await db.insert(schema.rankings).values([
      {
        userId: user.id,
        type: "general" as const,
        points: user.totalPoints,
        rank: rand(1, 100),
      },
      {
        userId: user.id,
        type: "weekly" as const,
        points: user.weeklyPoints,
        rank: rand(1, 100),
        weekNumber: rand(1, 12),
      },
    ]);
  }

  for (let i = 0; i < 40; i++) {
    const author = pick(userRows);
    await db.insert(schema.posts).values({
      userId: author.id,
      content: pick(POST_SAMPLES),
      likesCount: rand(0, 50),
      commentsCount: rand(0, 10),
    });
  }

  const postRows = await db.select().from(schema.posts).limit(20);
  for (const post of postRows) {
    const numComments = rand(0, 4);
    for (let c = 0; c < numComments; c++) {
      await db.insert(schema.comments).values({
        postId: post.id,
        userId: pick(userRows).id,
        content: pick([
          "Concordo totalmente!",
          "Nem pensar, mandante forte.",
          "Vai ser pegado esse jogo.",
          "Bora subir no ranking!",
        ]),
      });
    }
  }

  for (const user of userRows.slice(0, 30)) {
    await db.insert(schema.notifications).values([
      {
        userId: user.id,
        type: "new_match",
        title: "Novo jogo disponível",
        body: "FEI x Mauá — Futsal Masculino. Faça seu palpite!",
      },
      {
        userId: user.id,
        type: "ranking_up",
        title: "Você subiu no ranking",
        body: `Subiu ${rand(1, 10)} posições no ranking semanal.`,
        read: rand(0, 1) === 1,
      },
    ]);
  }

  await db.insert(schema.matchesImportQueue).values([
    {
      source: "external_api",
      externalId: "ext-match-001",
      payload: JSON.stringify({ placeholder: true, note: "Future import" }),
      status: "pending",
    },
  ]);

  await db.insert(schema.statisticsImportQueue).values([
    {
      source: "external_api",
      matchExternalId: "ext-match-001",
      payload: JSON.stringify({ placeholder: true }),
      status: "pending",
    },
  ]);

  console.log(`✅ Seeded:
  - ${uniRows.length} universities
  - ${courseRows.length} courses
  - ${athleticsRows.length} athletics
  - ${userRows.length} users
  - ${matchRows.length} matches
  - achievements, posts, notifications, import queues`);

  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
