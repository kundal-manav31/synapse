export type SubscriptionTier = 'free' | 'pro' | 'team';

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  elo: number;
  streak_current: number;
  streak_longest: number;
  last_played_date: string | null;
  subscription_tier: SubscriptionTier;
  ls_customer_id: string | null;
  ls_subscription_id: string | null;
  ls_portal_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface DailyPuzzle {
  id: string;
  puzzle_date: string;
  seed: number;
  difficulty: number;
  created_at: string;
}

export interface GameSession {
  id: string;
  user_id: string;
  puzzle_id: string;
  puzzle_date: string;
  memory_score: number | null;
  speed_score: number | null;
  pattern_score: number | null;
  math_score: number | null;
  stroop_score: number | null;
  total_score: number | null;
  elo_before: number | null;
  elo_after: number | null;
  elo_change: number | null;
  global_rank: number | null;
  percentile: number | null;
  completion_time_ms: number | null;
  completed_at: string;
}

export interface DomainScores {
  memory: number;
  speed: number;
  pattern: number;
  math: number;
  stroop: number;
}

export interface SubmitScoreRequest extends DomainScores {
  completion_time_ms: number;
}

export interface SubmitScoreResponse {
  session: GameSession;
  elo_before: number;
  elo_after: number;
  elo_change: number;
  global_rank: number;
  percentile: number;
  total_score: number;
}

export interface LeaderboardEntry {
  puzzle_date: string;
  total_score: number;
  global_rank: number | null;
  percentile: number | null;
  elo: number | null;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  streak_current: number;
}
