import axios from 'axios';
import { SBLeaderboardPlayerSummary } from '../types/sb_leaderboard_summary'

const API_BASE_URL = `${import.meta.env.VITE_IS_LIVE === "true" ? import.meta.env.VITE_LIVE_API_URL : import.meta.env.VITE_TEST_API_URL}`;

// Fetch all player summaries
export const fetchSBAllPlayerSummaries = async (): Promise<SBLeaderboardPlayerSummary[]> => {
  const response = await axios.get(`${API_BASE_URL}/api/leaderboardsbsummary/`);
  // Flatten if response is nested
  const rawPlayers = Array.isArray(response.data[0]) ? response.data.flat() : response.data;

  // Parse each player object
  let players: SBLeaderboardPlayerSummary[] = rawPlayers
    .map((p: any) => ({
      ...p,
      first_id: p.first_id ? BigInt(p.first_id) : BigInt(0),
      total_kills: p.total_kills ? BigInt(p.total_kills) : BigInt(0),
      total_deaths: p.total_deaths ? BigInt(p.total_deaths) : BigInt(0),
      total_damage_dealt: p.total_damage_dealt ? BigInt(p.total_damage_dealt) : BigInt(0),
      total_damage_taken: p.total_damage_taken ? BigInt(p.total_damage_taken) : BigInt(0),
      total_matches: p.total_matches ? BigInt(p.total_matches) : BigInt(0),
      total_wins: p.total_wins ? BigInt(p.total_wins) : BigInt(0),
      total_draws: p.total_draws ? BigInt(p.total_draws) : BigInt(0),
      total_losses: p.total_losses ? BigInt(p.total_losses) : BigInt(0),
      avg_score: p.avg_score ? Math.round(Number(p.avg_score)) : 0,
      avg_rank_score: p.avg_rank_score ? Number(p.avg_rank_score) : 0,
      avg_rating: p.avg_rating ? Number(p.avg_rating) : 0,
      avg_score_minute: p.avg_score_minute ? Number(p.avg_score_minute) : 0,
      avg_kill_death_ratio: p.avg_kill_death_ratio ? Number(p.avg_kill_death_ratio) : 0,
      avg_win_loss_ratio: p.avg_win_loss_ratio ? Number(p.avg_win_loss_ratio) : 0,
      avg_accuracy: p.avg_accuracy ? Number(p.avg_accuracy) : 0,
      avg_rank: p.avg_rank ? Number(Number(p.avg_rank).toFixed(2)) : 0,
      total_flight_time: p.total_flight_time
        ? `${p.total_flight_time.hours ?? 0}:${p.total_flight_time.minutes ?? 0}:${p.total_flight_time.seconds ?? 0}`
        : "0:0:0",
      avg_flight_time: p.avg_flight_time ?? "",
      created_at: p.created_at ? BigInt(p.created_at) : BigInt(0),
      org_media:
        p.org_media && typeof p.org_media === "string" && p.org_media.startsWith("/media")
          ? `https://robertsspaceindustries.com${p.org_media}`
          : p.org_media,
      account_media:
        p.account_media && typeof p.account_media === "string" && p.account_media.startsWith("/media")
          ? `https://robertsspaceindustries.com${p.account_media}`
          : p.account_media,
      total_rating: p.total_rating ? Number(p.total_rating) : 0, // Add total_rating
      total_score: p.total_score ? Number(p.total_score) : 0, // Add total_score
    }))
    // Filter out empty player (no nickname and avg_rank 0)
    .filter((player: SBLeaderboardPlayerSummary) => player.nickname && player.nickname.trim() !== "" && player.avg_rank !== 0);

  // Calculate global totals
  const total_global_damage_dealt = players.reduce((sum, p) => sum + Number(p.total_damage_dealt), 0);
  const total_global_kills = players.reduce((sum, p) => sum + Number(p.total_kills), 0);
  const global_avg_damage_to_kill_ratio = total_global_kills > 0
    ? total_global_damage_dealt / total_global_kills
    : 0;

  // Calculate distribution percentiles
  const all_ratios = players.map(p => Number(p.total_damage_dealt) / Math.max(Number(p.total_kills), 1));
  all_ratios.sort((a, b) => a - b);
  const lower20 = all_ratios[Math.floor(all_ratios.length * 0.20)] ?? 0;

  // Sort by total_rating descending
  players = players.sort((a, b) => Number(b.total_rating) - Number(a.total_rating));

  // Assign rank based on sorted order
  players = players.map((player, idx) => ({
    ...player,
    rank: idx + 1,
    modified_rating: (player.avg_score_minute * 2) + (player.total_score / 300) + (player.avg_kill_death_ratio * 200),
    killsteal_modified_rating: player.total_score * computeKillstealModifier(player, global_avg_damage_to_kill_ratio, lower20)
  }));
  // killsteal_modified_rating: total_score * ()

  return players;
};

// Fetch a player summary by nickname
export const fetchPlayerSummaryByNickname = async (nickname: string): Promise<SBLeaderboardPlayerSummary> => {
  const response = await axios.get<SBLeaderboardPlayerSummary>(`${API_BASE_URL}/api/leaderboardsbsummary/${encodeURIComponent(nickname)}`);
  return response.data;
};

function computeKillstealModifier(player: any, global_avg: number, lower20: number): number {
  const player_ratio = Number(player.total_damage_dealt) / Math.max(Number(player.total_kills), 1);

  if (player_ratio >= global_avg) {
    return 1; // No penalty
  } else if (player_ratio <= lower20) {
    return 0.85; // Max penalty
  } else {
    // Linear interpolation between 0.85 and 1
    const scale = (player_ratio - lower20) / (global_avg - lower20);
    return 0.85 + (0.15 * scale);
  }
}