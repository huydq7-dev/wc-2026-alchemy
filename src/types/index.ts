export interface Team {
  name: string;
  code: string;
  flag: string;
}

export interface Match {
  id: string;
  date: string;
  time: string;
  team_a_name: string;
  team_a_code: string;
  team_a_flag: string;
  team_b_name: string;
  team_b_code: string;
  team_b_flag: string;
  deal: string;
  deal_side: 'A' | 'B';
  venue: string;
  stage: string;
  status: 'upcoming' | 'live' | 'finished';
  score_a: number | null;
  score_b: number | null;
}

export interface MatchDetail extends Match {
  predictions: PredictionWithUser[];
  dealInfo: DealInfo | null;
}

export interface DealInfo {
  dealTeam: string;
  dealValue: string;
  adjustedA: number;
  adjustedB: number;
  result: string;
  summary: string;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  paid: number | boolean;
  created_at?: string;
}

export interface Prediction {
  id?: number;
  user_id: string;
  match_id: string;
  pick: 'A' | 'B';
  result: 'win' | 'lose' | 'draw' | null;
  points: number | null;
  created_at?: string;
}

export interface PredictionWithUser extends Prediction {
  name: string;
  avatar: string;
}

export interface PredictionHistory extends Prediction {
  date: string;
  time: string;
  team_a_name: string;
  team_a_flag: string;
  team_a_code: string;
  team_b_name: string;
  team_b_flag: string;
  team_b_code: string;
  deal: string;
  deal_side: string;
  stage: string;
  status: string;
  score_a: number | null;
  score_b: number | null;
}

export interface PredictionStats {
  total: number;
  wins: number;
  losses: number;
  draws: number;
  pending: number;
  totalPoints: number;
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  avatar: string;
  totalPoints: number;
  wins: number;
  losses: number;
  draws: number;
  pendingBets: number;
  totalBets: number;
  winRate: number;
  debt: number;
  debtPaid: boolean;
  rank: number;
  progressPercent: number;
  streak: number;
}

export interface LeaderboardData {
  entries: LeaderboardEntry[];
  maxPoints: number;
}

export interface FundData {
  betAmount: number;
  totalFund: number;
  settledCount: number;
  unsettledCount: number;
  settledUsers: DebtUser[];
  unsettledUsers: DebtUser[];
}

export interface DebtUser {
  userId: string;
  name: string;
  avatar: string;
  losses: number;
  debt: number;
  settled: boolean;
  totalPoints: number;
}

export interface Rule {
  id: string;
  title: string;
  content: string;
  sort_order: number;
}

export interface StandingRow {
  team: string;
  code: string;
  flag: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
}

export interface StandingsData {
  groups: Record<string, StandingRow[]>;
}

export interface BracketTeam {
  name: string;
  code: string;
  flag: string;
}

export interface BracketMatch {
  id: string;
  date: string;
  time: string;
  team_a: BracketTeam;
  team_b: BracketTeam;
  score_a: number | null;
  score_b: number | null;
  venue: string;
  status: string;
}

export interface BracketRound {
  name: string;
  matches: BracketMatch[];
}

export interface BracketData {
  rounds: BracketRound[];
}

export interface UserProfileStats {
  rank: number;
  totalPoints: number;
  wins: number;
  losses: number;
  draws: number;
  pendingBets: number;
  totalBets: number;
  winRate: number;
  debt: number;
  debtPaid: boolean;
  progressPercent: number;
}

export interface FavoriteTeam {
  name: string;
  flag: string;
  count: number;
}

export interface BiggestWin {
  matchId: string;
  team_a_name: string;
  team_b_name: string;
  team_a_flag: string;
  team_b_flag: string;
  pickedTeam: string;
  pickedFlag: string;
  minorityPercent: number;
  date: string;
  stage: string;
}

export interface UserProfile {
  user: User;
  stats: UserProfileStats;
  recentForm: string[];
  streak: number;
  favoriteTeam: FavoriteTeam | null;
  underdogRate: number;
  bestStage: string | null;
  clutchRate: number;
  biggestWin: BiggestWin | null;
}
