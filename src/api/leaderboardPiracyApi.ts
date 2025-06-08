import axios from "axios";
import { getUserById } from "./userService";

const API_BASE_URL = `${import.meta.env.VITE_IS_LIVE === "true" ? import.meta.env.VITE_LIVE_API_URL : import.meta.env.VITE_TEST_API_URL}`;

// Define the player type based on your view
export interface PiracyPlayer {
  player_id: string;
  patch: string;
  hits_created: number;
  air_count: number;
  ground_count: number;
  mixed_count: number;
  brute_force_count: number;
  extortion_count: number;
  total_value: number;
  username: string;
  nickname: string;
}

// Get leaderboard for a specific patch
export async function fetchPiracyLeaderboardByPatch(patch: string) {
  const response = await axios.get(`${API_BASE_URL}/api/leaderboardpiracysummary/patch/${encodeURIComponent(patch)}`);
  return response.data;
}

// Get stats for a specific player
export async function fetchPiracyPlayerStats(player_id: string) {
  const response = await axios.get(`${API_BASE_URL}/api/leaderboardpiracysummary/player/${encodeURIComponent(player_id)}`);
  return response.data;
}

// Fetch and enrich leaderboard for a specific patch
export async function fetchPiracyLeaderboardByPatchEnriched(patch: string): Promise<PiracyPlayer[]> {
  const response = await axios.get(`${API_BASE_URL}/api/leaderboardpiracysummary/patch/${encodeURIComponent(patch)}`);
  const playersRaw = response.data;
  const players: Omit<PiracyPlayer, "username" | "nickname">[] = Array.isArray(playersRaw) ? playersRaw : [];

  const enrichedPlayers = await Promise.all(
    players.map(async (player) => {
      try {
        const user = await getUserById(player.player_id);
        return {
          ...player,
          total_value: Math.round(Number(player.total_value)), // Ensure total_value is rounded
          username: user?.username ?? "",
          nickname: user?.nickname ?? "",
        };
      } catch {
        return {
          ...player,
          total_value: Math.round(Number(player.total_value)),
          username: "",
          nickname: "",
        };
      }
    })
  );

  return enrichedPlayers;
}