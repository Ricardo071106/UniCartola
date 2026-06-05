import { getMockData, DEMO_USER_ID } from "@/lib/mock/generator";
import type {
  Achievement,
  Comment,
  DemoUser,
  LeaderboardEntry,
  Match,
  MatchStats,
  Notification,
  Post,
  Prediction,
  University,
} from "./types";

const mock = () => getMockData();

export function getCompetition() {
  return mock().competition;
}

export function getUniversities() {
  return mock().universities;
}

export function getUniversityBySlug(slug: string) {
  return mock().universities.find((u) => u.slug === slug) ?? null;
}

export function getCourses() {
  return mock().courses;
}

export function getAthletics() {
  return mock().athletics;
}

export function getAthleticsBySchool(schoolId: string) {
  return mock().athletics.filter((a) => a.schoolId === schoolId);
}

export function getFeaturedMatch(): Match | null {
  return mock().matches.find((m) => m.featured) ?? mock().matches[0] ?? null;
}

export function getMatchesByStatus(statuses: Match["status"][], limit = 20) {
  return mock()
    .matches.filter((m) => statuses.includes(m.status))
    .slice(0, limit);
}

export function getTodayMatches(limit = 12) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return mock()
    .matches.filter((m) => {
      const d = new Date(m.scheduledAt);
      return d >= today && d < tomorrow;
    })
    .slice(0, limit);
}

export function getAllMatches(limit = 50) {
  return mock().matches.slice(0, limit);
}

export function getMatchById(id: string): Match | null {
  return mock().matches.find((m) => m.id === id) ?? null;
}

export function getMatchStats(matchId: string): MatchStats | null {
  return mock().matchStatsMap.get(matchId) ?? null;
}

export function getLeaderboard(
  scope: "global" | "weekly" | "school" | "course" | "athletic" | "historical",
  scopeId?: string | null,
  limit = 10
): LeaderboardEntry[] {
  const data = mock();
  if (scope === "weekly") return data.buildLeaderboard("weekly").slice(0, limit);
  if (scope === "historical" || scope === "global") return data.buildLeaderboard("global").slice(0, limit);
  if (scope === "school" && scopeId) return data.buildLeaderboard("school", scopeId).slice(0, limit);
  if (scope === "course" && scopeId) {
    return data.users
      .filter((u) => u.courseId === scopeId)
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, limit)
      .map((u, i) => ({
        rank: i + 1,
        userId: u.id,
        displayName: u.displayName,
        schoolName: data.schoolMap[u.schoolId].shortName,
        totalPoints: u.totalPoints,
        matchPoints: u.totalPoints,
        correctRate: Math.round((u.correctPredictions / u.predictionsCount) * 100),
      }));
  }
  if (scope === "athletic" && scopeId) {
    return data.users
      .filter((u) => u.athleticId === scopeId)
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, limit)
      .map((u, i) => ({
        rank: i + 1,
        userId: u.id,
        displayName: u.displayName,
        schoolName: data.schoolMap[u.schoolId].shortName,
        totalPoints: u.totalPoints,
        matchPoints: u.totalPoints,
        correctRate: Math.round((u.correctPredictions / u.predictionsCount) * 100),
      }));
  }
  return data.buildLeaderboard("global").slice(0, limit);
}

export function getUniversityRankings(limit = 10): University[] {
  return [...mock().universities].sort((a, b) => b.weeklyPoints - a.weeklyPoints).slice(0, limit);
}

export function getStreakHighlights(limit = 5) {
  return [...mock().users]
    .sort((a, b) => b.streak - a.streak)
    .slice(0, limit)
    .map((u) => ({
      userId: u.id,
      displayName: u.displayName,
      schoolName: mock().schoolMap[u.schoolId].shortName,
      streak: u.streak,
    }));
}

export function getDemoUser(): DemoUser {
  return mock().getDemoUser();
}

export function getUserById(id: string): DemoUser | null {
  const data = mock();
  const u = data.users.find((x) => x.id === id);
  if (!u) return null;
  return {
    ...u,
    schoolName: data.schoolMap[u.schoolId].name,
    courseName: data.courseMap[u.courseId].name,
    athleticName: data.athleticMap[u.athleticId].name,
  };
}

export function getUserAchievements(userId: string): (Achievement & { earnedAt: Date })[] {
  const data = mock();
  return data.userAchievements
    .filter((ua) => ua.userId === userId)
    .map((ua) => {
      const achievement = data.achievements.find((a) => a.id === ua.achievementId)!;
      return { ...achievement, earnedAt: ua.earnedAt };
    });
}

export function getAllAchievements() {
  return mock().achievements;
}

export function getUserPrediction(userId: string, matchId: string): Prediction | null {
  return mock().predictions.find((p) => p.userId === userId && p.matchId === matchId) ?? null;
}

export function getPosts(limit = 20): Post[] {
  return mock().posts.slice(0, limit);
}

export function getComments(postId: string): Comment[] {
  return mock().comments.filter((c) => c.postId === postId);
}

export function getNotifications(userId: string): Notification[] {
  return mock().notifications.filter((n) => n.userId === userId);
}

export { DEMO_USER_ID };
