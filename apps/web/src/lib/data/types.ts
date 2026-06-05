export type University = {
  id: string;
  name: string;
  slug: string;
  shortName: string;
  city: string;
  weeklyPoints: number;
  rank: number;
};

export type Course = { id: string; name: string; slug: string };
export type Athletic = { id: string; name: string; slug: string; schoolId: string };

export type Modality = {
  id: string;
  name: string;
  slug: string;
  sport: string;
  gender: string;
};

export type MatchStatus = "scheduled" | "live" | "finished" | "postponed" | "cancelled";
export type PredictionOutcome = "home_win" | "draw" | "away_win";

export type Match = {
  id: string;
  competitionId: string;
  modalityId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  modalityName: string;
  sport: string;
  series: string;
  groupName: string;
  scheduledAt: Date;
  status: MatchStatus;
  homeScore: number | null;
  awayScore: number | null;
  venue: string | null;
  predictionsOpen: boolean;
  featured?: boolean;
};

export type MatchStats = {
  matchId: string;
  goals: { player: string; team: string; minute: number }[];
  assists: { player: string; team: string }[];
  cards: { player: string; team: string; type: "yellow" | "red" }[];
  topScorers: { player: string; team: string; count: number }[];
};

export type User = {
  id: string;
  displayName: string;
  schoolId: string;
  courseId: string;
  athleticId: string;
  totalPoints: number;
  weeklyPoints: number;
  predictionsCount: number;
  correctPredictions: number;
  streak: number;
  globalRank: number;
  schoolRank: number;
  courseRank: number;
};

export type Achievement = {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string;
};

export type UserAchievement = {
  userId: string;
  achievementId: string;
  earnedAt: Date;
};

export type Prediction = {
  id: string;
  userId: string;
  matchId: string;
  outcome: PredictionOutcome;
  homeScore: number | null;
  awayScore: number | null;
};

export type Post = {
  id: string;
  userId: string;
  userName: string;
  schoolName: string;
  content: string;
  createdAt: Date;
  reactions: number;
  commentsCount: number;
};

export type Comment = {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: Date;
};

export type Notification = {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: Date;
};

export type LeaderboardEntry = {
  rank: number;
  userId: string;
  displayName: string;
  schoolName: string;
  totalPoints: number;
  matchPoints: number;
  correctRate: number;
};

export type Competition = {
  id: string;
  name: string;
  slug: string;
  season: string;
  semester: string;
};

export type DemoUser = User & {
  schoolName: string;
  courseName: string;
  athleticName: string;
};
