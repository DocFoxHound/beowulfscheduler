export interface SBLeaderboardOrgSummary {
  name: string;
  first_id: bigint;
  symbol: string;
  org_media: string;
  created_at: bigint;
  avg_rank_score: number;
  total_kills: bigint;
  total_deaths: bigint;
  avg_score: number;
  total_damage_dealt: bigint;
  total_damage_taken: bigint;
  total_matches: bigint;
  total_flight_time: string;
  total_wins: bigint;
  total_draws: bigint;
  avg_rating: number;
  avg_flight_time: string;
  avg_score_minute: number;
  avg_kill_death_ratio: number;
  total_losses: bigint;
  avg_win_loss_ratio: number;
  avg_accuracy: number;
  avg_rank: number;
  total_rating: number;
  total_score: number;
}