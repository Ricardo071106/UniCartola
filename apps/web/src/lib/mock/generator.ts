import type {
  Achievement,
  Athletic,
  Comment,
  Competition,
  Course,
  DemoUser,
  LeaderboardEntry,
  Match,
  MatchStats,
  Modality,
  Notification,
  Post,
  Prediction,
  University,
  User,
  UserAchievement,
} from "@/lib/data/types";

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function uuid(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  const hex = Math.abs(h).toString(16).padStart(8, "0");
  return `${hex.slice(0, 8)}-${hex.slice(0, 4)}-4${hex.slice(1, 4)}-a${hex.slice(2, 5)}-${hex.padEnd(12, "0").slice(0, 12)}`;
}

const SCHOOL_NAMES = [
  "FEI",
  "Mackenzie",
  "Insper",
  "FGV",
  "Mauá",
  "ESPM",
  "FEA USP",
  "Poli USP",
  "Medicina USP",
  "PUC SP",
  "ITA",
  "Einstein",
  "Anhembi Morumbi",
  "FAAP",
  "IBMEC SP",
  "UNIFESP",
  "UFABC",
  "UNINOVE",
  "Belas Artes",
  "São Judas",
];

const COURSE_NAMES = [
  "Engenharia",
  "Administração",
  "Medicina",
  "Direito",
  "Economia",
  "Ciências da Computação",
  "Arquitetura",
  "Comunicação",
  "Psicologia",
  "Educação Física",
  "Design",
  "Engenharia Mecânica",
];

const MODALITIES: Omit<Modality, "id">[] = [
  { name: "Futsal Masculino", slug: "futsal-masculino", sport: "Futsal", gender: "M" },
  { name: "Futsal Feminino", slug: "futsal-feminino", sport: "Futsal", gender: "F" },
  { name: "Futebol Masculino", slug: "futebol-masculino", sport: "Futebol", gender: "M" },
  { name: "Basquete Masculino", slug: "basquete-masculino", sport: "Basquete", gender: "M" },
  { name: "Basquete Feminino", slug: "basquete-feminino", sport: "Basquete", gender: "F" },
  { name: "Vôlei Masculino", slug: "volei-masculino", sport: "Vôlei", gender: "M" },
];

const VENUES = [
  "Ginásio Poliesportivo FEI",
  "Arena Mackenzie",
  "Centro Esportivo Insper",
  "Quadra FGV",
  "Campus Mauá",
  "Complexo ESPM",
];

const NICKNAMES = [
  "Palpiteiro",
  "Cravador",
  "Mestre",
  "Lenda",
  "Profeta",
  "Campeão",
  "Atleta",
  "Torcedor",
  "Capitão",
  "Artilheiro",
  "Goleiro",
  "Técnico",
  "Scout",
  "Fanático",
  "Invicto",
];

const POST_TEMPLATES = [
  "{home} vai atropelar a {away} hoje.",
  "Palpite fechado: {home} 3 x 1 {away}.",
  "A atlética da {home} não perde em casa.",
  "Quem mais acerta o placar de {home} x {away}?",
  "Basquete hoje promete — {home} em vantagem.",
  "Futsal é coisa séria. {away} vem forte.",
  "Semana decisiva pro ranking da {home}!",
  "Top 10 da faculdade ou nada.",
];

function pick<T>(arr: T[], i: number) {
  return arr[i % arr.length];
}

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export const DEMO_USER_ID = uuid("demo-user-fei");

export function buildMockDataset() {
  const competition: Competition = {
    id: uuid("competition-2026-1"),
    name: "Campus League 2026 — 1º Semestre",
    slug: "campus-league-2026-1",
    season: "2026",
    semester: "1",
  };

  const universities: University[] = SCHOOL_NAMES.map((name, i) => ({
    id: uuid(`school-${name}`),
    name,
    slug: slugify(name),
    shortName: name,
    city: "São Paulo",
    weeklyPoints: Math.floor(800 - i * 28 + seededRandom(i) * 50),
    rank: i + 1,
  }));

  const courses: Course[] = COURSE_NAMES.map((name) => ({
    id: uuid(`course-${name}`),
    name,
    slug: slugify(name),
  }));

  const athletics: Athletic[] = universities.map((u) => ({
    id: uuid(`athletic-${u.slug}`),
    name: `Atlética ${u.shortName}`,
    slug: slugify(`atletica-${u.shortName}`),
    schoolId: u.id,
  }));

  const modalities: Modality[] = MODALITIES.map((m) => ({
    ...m,
    id: uuid(`modality-${m.slug}`),
  }));

  const users: User[] = Array.from({ length: 100 }, (_, i) => {
    const school = pick(universities, i * 3);
    const course = pick(courses, i * 7);
    const athletic = athletics.find((a) => a.schoolId === school.id)!;
    const correct = 12 + Math.floor(seededRandom(i + 1) * 45);
    const total = 15 + Math.floor(seededRandom(i + 2) * 80);
    return {
      id: i === 0 ? DEMO_USER_ID : uuid(`user-${i}`),
      displayName: `${pick(NICKNAMES, i)}${(i % 99) + 1}`,
      schoolId: school.id,
      courseId: course.id,
      athleticId: athletic.id,
      totalPoints: correct * 3 + Math.floor(seededRandom(i + 3) * 40),
      weeklyPoints: Math.floor(seededRandom(i + 4) * 35),
      predictionsCount: total,
      correctPredictions: correct,
      streak: Math.floor(seededRandom(i + 5) * 12),
      globalRank: i + 1,
      schoolRank: (i % 8) + 1,
      courseRank: (i % 5) + 1,
    };
  }).sort((a, b) => b.totalPoints - a.totalPoints);

  users.forEach((u, i) => {
    u.globalRank = i + 1;
  });

  const matches: Match[] = [];
  const matchStatsMap = new Map<string, MatchStats>();

  for (let i = 0; i < 200; i++) {
    const home = pick(universities, i * 2);
    let away = pick(universities, i * 3 + 1);
    if (away.id === home.id) away = pick(universities, i + 5);
    const mod = pick(modalities, i);
    const daysOffset = i < 8 ? i - 2 : i < 16 ? 0 : i < 40 ? Math.floor(i / 8) : -(i % 30);
    const scheduledAt = new Date();
    scheduledAt.setHours(10 + (i % 10), (i % 4) * 15, 0, 0);
    scheduledAt.setDate(scheduledAt.getDate() + daysOffset);

    let status: Match["status"] = "scheduled";
    let homeScore: number | null = null;
    let awayScore: number | null = null;

    if (daysOffset < 0) {
      status = "finished";
      homeScore = Math.floor(seededRandom(i + 10) * 6);
      awayScore = Math.floor(seededRandom(i + 11) * 6);
    } else if (daysOffset === 0 && i % 7 === 0) {
      status = "live";
      homeScore = Math.floor(seededRandom(i + 12) * 4);
      awayScore = Math.floor(seededRandom(i + 13) * 4);
    }

    const match: Match = {
      id: uuid(`match-${i}`),
      competitionId: competition.id,
      modalityId: mod.id,
      homeTeamId: uuid(`team-${home.slug}`),
      awayTeamId: uuid(`team-${away.slug}`),
      homeTeamName: home.shortName,
      awayTeamName: away.shortName,
      modalityName: mod.name,
      sport: mod.sport,
      series: ["A", "B", "C"][i % 3],
      groupName: ["A", "B"][i % 2],
      scheduledAt,
      status,
      homeScore,
      awayScore,
      venue: pick(VENUES, i),
      predictionsOpen: status === "scheduled",
      featured: i === 0,
    };

    matches.push(match);

    if (status === "finished" && homeScore != null && awayScore != null) {
      matchStatsMap.set(match.id, {
        matchId: match.id,
        goals: [
          { player: "João Silva", team: home.shortName, minute: 12 },
          { player: "Pedro Costa", team: away.shortName, minute: 28 },
          ...(homeScore + awayScore > 2
            ? [{ player: "Lucas Alves", team: home.shortName, minute: 45 }]
            : []),
        ],
        assists: [{ player: "Rafael Mendes", team: home.shortName }],
        cards: [{ player: "Bruno Lima", team: away.shortName, type: "yellow" }],
        topScorers: [{ player: "João Silva", team: home.shortName, count: 2 }],
      });
    }
  }

  matches.sort((a, b) => b.scheduledAt.getTime() - a.scheduledAt.getTime());

  const achievements: Achievement[] = [
    { id: uuid("ach-first"), code: "first_prediction", title: "Primeiro Palpite", description: "Fez seu primeiro palpite", icon: "target" },
    { id: uuid("ach-streak"), code: "streak_10", title: "10 Acertos Seguidos", description: "10 acertos consecutivos de vencedor", icon: "flame" },
    { id: uuid("ach-50"), code: "games_50", title: "50 Jogos", description: "Palpitou em 50 jogos", icon: "medal" },
    { id: uuid("ach-100"), code: "games_100", title: "100 Jogos", description: "Palpitou em 100 jogos", icon: "trophy" },
    { id: uuid("ach-school"), code: "school_top_10", title: "Top 10 Faculdade", description: "Entrou no top 10 da sua faculdade", icon: "school" },
    { id: uuid("ach-week"), code: "weekly_top", title: "Melhor da Semana", description: "Liderou o ranking semanal", icon: "crown" },
    { id: uuid("ach-futsal"), code: "futsal_specialist", title: "Especialista em Futsal", description: "80%+ de acerto em futsal", icon: "soccer" },
    { id: uuid("ach-basket"), code: "basket_specialist", title: "Especialista em Basquete", description: "80%+ de acerto em basquete", icon: "basketball" },
    { id: uuid("ach-football"), code: "football_specialist", title: "Especialista em Futebol", description: "80%+ de acerto em futebol", icon: "football" },
  ];

  const userAchievements: UserAchievement[] = users.slice(0, 30).flatMap((u, ui) =>
    achievements.slice(0, 2 + (ui % 4)).map((a, ai) => ({
      userId: u.id,
      achievementId: a.id,
      earnedAt: new Date(Date.now() - (ui + ai) * 86400000),
    }))
  );

  const predictions: Prediction[] = matches.slice(0, 30).map((m, i) => ({
    id: uuid(`pred-demo-${i}`),
    userId: DEMO_USER_ID,
    matchId: m.id,
    outcome: (["home_win", "draw", "away_win"] as const)[i % 3],
    homeScore: i % 2 === 0 ? 2 : null,
    awayScore: i % 2 === 0 ? 1 : null,
  }));

  const posts: Post[] = Array.from({ length: 25 }, (_, i) => {
    const user = pick(users, i + 3);
    const home = pick(universities, i);
    const away = pick(universities, i + 2);
    const school = universities.find((s) => s.id === user.schoolId)!;
    const template = pick(POST_TEMPLATES, i);
    return {
      id: uuid(`post-${i}`),
      userId: user.id,
      userName: user.displayName,
      schoolName: school.shortName,
      content: template.replace("{home}", home.shortName).replace("{away}", away.shortName),
      createdAt: new Date(Date.now() - i * 3600000 * 2),
      reactions: 3 + (i % 15),
      commentsCount: i % 4,
    };
  });

  const comments: Comment[] = posts.slice(0, 10).flatMap((p, pi) =>
    Array.from({ length: p.commentsCount }, (_, ci) => {
      const user = pick(users, pi + ci + 10);
      return {
        id: uuid(`comment-${pi}-${ci}`),
        postId: p.id,
        userId: user.id,
        userName: user.displayName,
        content: ["Concordo!", "Vai ser difícil.", "Palpite arriscado.", "Bora!"][ci % 4],
        createdAt: new Date(p.createdAt.getTime() + (ci + 1) * 600000),
      };
    })
  );

  const notifications: Notification[] = [
    {
      id: uuid("notif-1"),
      userId: DEMO_USER_ID,
      type: "match_reminder",
      title: "Jogo em breve",
      body: "Seu jogo FEI x Mauá começa em 2 horas.",
      read: false,
      createdAt: new Date(),
    },
    {
      id: uuid("notif-2"),
      userId: DEMO_USER_ID,
      type: "rank_up",
      title: "Subiu no ranking",
      body: "Você subiu para o 3º lugar no ranking geral.",
      read: false,
      createdAt: new Date(Date.now() - 3600000),
    },
    {
      id: uuid("notif-3"),
      userId: DEMO_USER_ID,
      type: "school_top",
      title: "Top 10 da FEI",
      body: "Você entrou no Top 10 da FEI.",
      read: true,
      createdAt: new Date(Date.now() - 86400000),
    },
    {
      id: uuid("notif-4"),
      userId: DEMO_USER_ID,
      type: "school_lead",
      title: "FEI na liderança",
      body: "FEI assumiu a liderança no ranking de faculdades.",
      read: true,
      createdAt: new Date(Date.now() - 172800000),
    },
  ];

  function buildLeaderboard(scope: "global" | "weekly" | "school", schoolId?: string): LeaderboardEntry[] {
    let filtered = [...users];
    if (scope === "school" && schoolId) {
      filtered = users.filter((u) => u.schoolId === schoolId);
    }
    const pointsKey = scope === "weekly" ? "weeklyPoints" : "totalPoints";
    return filtered
      .sort((a, b) => b[pointsKey] - a[pointsKey])
      .slice(0, scope === "global" || scope === "weekly" ? 10 : 30)
      .map((u, i) => {
        const school = universities.find((s) => s.id === u.schoolId)!;
        return {
          rank: i + 1,
          userId: u.id,
          displayName: u.displayName,
          schoolName: school.shortName,
          totalPoints: u[pointsKey],
          matchPoints: u[pointsKey],
          correctRate: u.predictionsCount
            ? Math.round((u.correctPredictions / u.predictionsCount) * 100)
            : 0,
        };
      });
  }

  const schoolMap = Object.fromEntries(universities.map((u) => [u.id, u]));
  const courseMap = Object.fromEntries(courses.map((c) => [c.id, c]));
  const athleticMap = Object.fromEntries(athletics.map((a) => [a.id, a]));

  function getDemoUser(): DemoUser {
    const u = users.find((x) => x.id === DEMO_USER_ID)!;
    return {
      ...u,
      schoolName: schoolMap[u.schoolId].name,
      courseName: courseMap[u.courseId].name,
      athleticName: athleticMap[u.athleticId].name,
    };
  }

  return {
    competition,
    universities,
    courses,
    athletics,
    modalities,
    users,
    matches,
    matchStatsMap,
    achievements,
    userAchievements,
    predictions,
    posts,
    comments,
    notifications,
    buildLeaderboard,
    getDemoUser,
    schoolMap,
    courseMap,
    athleticMap,
  };
}

export type MockDataset = ReturnType<typeof buildMockDataset>;

let cached: MockDataset | null = null;

export function getMockData(): MockDataset {
  if (!cached) cached = buildMockDataset();
  return cached;
}
