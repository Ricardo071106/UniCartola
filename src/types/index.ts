export type SportSlug = "futebol" | "futsal" | "basquete";

export type MatchStatus = "scheduled" | "live" | "finished" | "cancelled";

export type PredictionResult = "home" | "draw" | "away";

export type RankingTab =
  | "general"
  | "university"
  | "course"
  | "athletics"
  | "weekly"
  | "historical";

export interface MatchWithTeams {
  id: string;
  modality: string;
  scheduledAt: Date;
  venue: string | null;
  status: MatchStatus;
  homeScore: number | null;
  awayScore: number | null;
  isFeatured: boolean;
  homeUniversity: {
    id: string;
    name: string;
    shortName: string;
    logoUrl: string | null;
  };
  awayUniversity: {
    id: string;
    name: string;
    shortName: string;
    logoUrl: string | null;
  };
  sport: {
    id: string;
    name: string;
    slug: string;
  };
  stats?: {
    goalsHome: number | null;
    goalsAway: number | null;
    assistsHome: number | null;
    assistsAway: number | null;
    basketsHome: number | null;
    basketsAway: number | null;
    yellowCardsHome: number | null;
    yellowCardsAway: number | null;
    redCardsHome: number | null;
    redCardsAway: number | null;
  } | null;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  nickname: string;
  avatarUrl: string | null;
  points: number;
  universityName?: string;
  universityShortName?: string;
}

export interface UniversityRankingEntry {
  rank: number;
  universityId: string;
  name: string;
  shortName: string;
  totalPoints: number;
  userCount?: number;
}

export interface PostWithAuthor {
  id: string;
  content: string;
  likesCount: number;
  commentsCount: number;
  createdAt: Date;
  user: {
    id: string;
    nickname: string;
    avatarUrl: string | null;
    university?: { shortName: string } | null;
  };
  likedByCurrentUser?: boolean;
}

export interface CommentWithAuthor {
  id: string;
  content: string;
  createdAt: Date;
  user: {
    nickname: string;
    avatarUrl: string | null;
    university?: { shortName: string } | null;
  };
}

export interface AchievementItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: Date | null;
}

export interface StandingsEntry {
  rank: number;
  universityId: string;
  athleticsId: string | null;
  teamName: string;
  logoUrl: string | null;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  goalDifference: number;
}

export interface ScorerEntry {
  rank: number;
  playerName: string;
  teamName: string;
  athleticsId: string | null;
  universityId: string | null;
  logoUrl: string | null;
  total: number;
}

export interface PlayoffMatch {
  id: string;
  phase: string;
  scheduledAt: Date;
  homeName: string;
  awayName: string;
  homeLogoUrl: string | null;
  awayLogoUrl: string | null;
  homeScore: number | null;
  awayScore: number | null;
  status: MatchStatus;
  winnerSide: "home" | "away" | "draw" | null;
}

export interface PlayoffBracket {
  rounds: { phase: string; matches: PlayoffMatch[] }[];
}

export interface UserProfile {
  id: string;
  nickname: string;
  avatarUrl: string | null;
  totalPoints: number;
  weeklyPoints: number;
  correctPredictions: number;
  totalPredictions: number;
  currentStreak: number;
  university: { name: string; shortName: string } | null;
  course: { name: string } | null;
  athletics: { name: string } | null;
  generalRank: number;
  universityRank: number;
}
