import { getDb } from "./client.js";
import {
  schools,
  courses,
  athletics,
  competitions,
  modalities,
  achievements,
  statMarkets,
  teams,
  matches,
} from "./schema/index";
import { eq } from "drizzle-orm";

function normalizeTeamName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const schoolData = [
  "FEI",
  "Mackenzie",
  "Insper",
  "FGV",
  "FEA USP",
  "Poli USP",
  "Medicina USP",
  "PUC SP",
  "ITA",
  "Einstein",
  "Anhembi Morumbi",
  "ESPM",
  "FAAP",
  "IBMEC SP",
];

const courseData = [
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
];

const athleticData = [
  { name: "Atlética FEI", school: "FEI" },
  { name: "Atlética Mackenzie", school: "Mackenzie" },
  { name: "Atlética Insper", school: "Insper" },
  { name: "Atlética FGV", school: "FGV" },
  { name: "Atlética Poli", school: "Poli USP" },
  { name: "Atlética FEA", school: "FEA USP" },
  { name: "Atlética PUC", school: "PUC SP" },
  { name: "Atlética ITA", school: "ITA" },
];

const achievementData = [
  {
    code: "streak_10",
    title: "Em chamas",
    description: "10 acertos consecutivos de vencedor",
    icon: "flame",
  },
  {
    code: "weekly_top",
    title: "Melhor da semana",
    description: "Ficou em 1º no ranking semanal",
    icon: "crown",
  },
  {
    code: "modality_king_futsal",
    title: "Rei do Futsal",
    description: "Top 10% em palpites de futsal na sua faculdade",
    icon: "soccer",
  },
  {
    code: "school_top_10",
    title: "Top 10 da Faculdade",
    description: "Entrou no top 10 do ranking da sua faculdade",
    icon: "school",
  },
  {
    code: "basket_specialist",
    title: "Especialista em Basquete",
    description: "80%+ de acerto em basquete (mín. 10 palpites)",
    icon: "basketball",
  },
];

async function seed() {
  const db = await getDb();
  console.log("Seeding database...");

  for (const name of schoolData) {
    await db
      .insert(schools)
      .values({ name, slug: slugify(name), shortName: name })
      .onConflictDoNothing({ target: schools.slug });
  }

  for (const name of courseData) {
    await db
      .insert(courses)
      .values({ name, slug: slugify(name) })
      .onConflictDoNothing({ target: courses.slug });
  }

  const schoolRows = await db.select().from(schools);
  const schoolBySlug = Object.fromEntries(schoolRows.map((s) => [s.slug, s]));

  for (const a of athleticData) {
    const school = schoolBySlug[slugify(a.school)];
    await db
      .insert(athletics)
      .values({
        name: a.name,
        slug: slugify(a.name),
        schoolId: school?.id,
      })
      .onConflictDoNothing({ target: athletics.slug });
  }

  const [comp] = await db
    .insert(competitions)
    .values({
      name: "NDU 2026 - 1º Semestre",
      slug: "ndu-2026-1",
      season: "2026",
      semester: "1",
      isActive: true,
    })
    .onConflictDoNothing({ target: competitions.slug })
    .returning();

  let competition = comp;
  if (!competition) {
    const existing = await db
      .select()
      .from(competitions)
      .where(eq(competitions.slug, "ndu-2026-1"))
      .limit(1);
    competition = existing[0];
  }

  if (competition) {
    const modalityDefs = [
      { name: "Futsal Masculino", slug: "futsal-masculino", gender: "M", nduUrl: "https://www.ndu.net.br/index.php/modalidades/lista_jogos/futsal-masculino" },
      { name: "Futsal Feminino", slug: "futsal-feminino", gender: "F", nduUrl: "https://www.ndu.net.br/index.php/modalidades/lista_jogos/futsal-feminino" },
      { name: "Futebol Masculino", slug: "futebol-masculino", gender: "M", nduUrl: "https://www.ndu.net.br/index.php/modalidades/lista_jogos/futebol-masculino" },
      { name: "Basquete Masculino", slug: "basquete-masculino", gender: "M", nduUrl: "https://www.ndu.net.br/index.php/modalidades/lista_jogos/basquete-masculino" },
      { name: "Basquete Feminino", slug: "basquete-feminino", gender: "F", nduUrl: "https://www.ndu.net.br/index.php/modalidades/lista_jogos/basquete-feminino" },
    ];

    for (const m of modalityDefs) {
      await db
        .insert(modalities)
        .values({
          competitionId: competition.id,
          name: m.name,
          slug: m.slug,
          gender: m.gender,
          nduUrl: m.nduUrl,
          isMvpEnabled: true,
        })
        .onConflictDoNothing();
    }

    const modRows = await db
      .select()
      .from(modalities)
      .where(eq(modalities.competitionId, competition.id));

    const futsalMod = modRows.find((m) => m.slug === "futsal-masculino");
    const basketMod = modRows.find((m) => m.slug === "basquete-masculino");

    if (futsalMod) {
      await db
        .insert(statMarkets)
        .values({
          competitionId: competition.id,
          modalityId: futsalMod.id,
          title: "Artilheiro — Futsal Masculino",
          slug: "artilheiro-futsal-m",
          marketType: "top_scorer",
          status: "open",
          pointsOnCorrect: 15,
        })
        .onConflictDoNothing();
    }

    if (basketMod) {
      await db
        .insert(statMarkets)
        .values({
          competitionId: competition.id,
          modalityId: basketMod.id,
          title: "Maior pontuador — Basquete Masculino",
          slug: "pontuador-basquete-m",
          marketType: "top_points",
          status: "open",
          pointsOnCorrect: 15,
        })
        .onConflictDoNothing();
    }
  }

  for (const a of achievementData) {
    await db.insert(achievements).values(a).onConflictDoNothing();
  }

  if (competition) {
    const modRows = await db
      .select()
      .from(modalities)
      .where(eq(modalities.competitionId, competition.id));

    const futsal = modRows.find((m) => m.slug === "futsal-masculino");
    if (futsal) {
      async function ensureTeam(name: string) {
        const norm = normalizeTeamName(name);
        const [t] = await db
          .select()
          .from(teams)
          .where(eq(teams.normalizedName, norm))
          .limit(1);
        if (t) return t.id;
        const [created] = await db
          .insert(teams)
          .values({ name, normalizedName: norm })
          .returning();
        return created.id;
      }

      const fei = await ensureTeam("FEI");
      const mack = await ensureTeam("Mackenzie");
      const insper = await ensureTeam("Insper");
      const fgv = await ensureTeam("FGV");

      const demoMatches = [
        {
          homeTeamId: fei,
          awayTeamId: mack,
          series: "A",
          groupName: "B",
          daysAhead: 3,
          externalKey: "demo:fei-mack-upcoming",
        },
        {
          homeTeamId: insper,
          awayTeamId: fgv,
          series: "B",
          groupName: "A",
          daysAhead: 5,
          externalKey: "demo:insper-fgv-upcoming",
        },
        {
          homeTeamId: fei,
          awayTeamId: insper,
          series: "A",
          groupName: "A",
          daysAhead: -2,
          homeScore: 5,
          awayScore: 3,
          status: "finished" as const,
          externalKey: "demo:fei-insper-finished",
        },
      ];

      for (const dm of demoMatches) {
        const scheduledAt = new Date();
        scheduledAt.setDate(scheduledAt.getDate() + dm.daysAhead);

        await db
          .insert(matches)
          .values({
            competitionId: competition.id,
            modalityId: futsal.id,
            homeTeamId: dm.homeTeamId,
            awayTeamId: dm.awayTeamId,
            series: dm.series,
            groupName: dm.groupName,
            scheduledAt,
            status: dm.status ?? "scheduled",
            homeScore: dm.homeScore ?? null,
            awayScore: dm.awayScore ?? null,
            externalKey: dm.externalKey,
            predictionsOpen: dm.status !== "finished",
          })
          .onConflictDoNothing({ target: matches.externalKey });
      }
    }
  }

  console.log("Seed completed.");
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
