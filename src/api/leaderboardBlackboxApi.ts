import axios from "axios";
import { getUserById } from "./userService";

const API_BASE_URL = `${import.meta.env.VITE_IS_LIVE === "true" ? import.meta.env.VITE_LIVE_API_URL : import.meta.env.VITE_TEST_API_URL}`;

// Define the player type based on your view
export interface BlackboxPlayer {
  id?: string; // Optional, since not present in your data
  user_id: string;
  patch: string;
  fps_kills_total: number;
  fps_kills_pu: number;
  fps_kills_ac: number;
  ship_kills_total: number;
  ship_kills_pu: number;
  ship_kills_ac: number;
  value_pu: number;
  value_ac: number;
}

export interface BlackboxPlayerEnriched extends BlackboxPlayer {
  username: string;
  nickname: string;
}

// Get leaderboard for a specific patch
export async function fetchBlackboxLeaderboardByPatch(patch: string): Promise<BlackboxPlayer[]> {
  const response = await axios.get(`${API_BASE_URL}/api/leaderboardblackboxsummary/patch/${encodeURIComponent(patch)}`);
  return response.data;
}

// Get stats for a specific player
export async function fetchBlackboxPlayerStats(player_id: string): Promise<BlackboxPlayer[]> {
  const response = await axios.get(`${API_BASE_URL}/api/leaderboardblackboxsummary/player/${encodeURIComponent(player_id)}`);
  return response.data;
}

export async function fetchBlackboxLeaderboardByPatchEnriched(patch: string): Promise<BlackboxPlayerEnriched[]> {
  const response = await fetchBlackboxLeaderboardByPatch(patch);
  const players: BlackboxPlayer[] = Array.isArray(response) ? response : [];

  const enrichedPlayers = await Promise.all(
    players.map(async (player) => {
      try {
        const user = await getUserById(player.user_id);
        return {
          ...player,
          username: user?.username ?? "",
          nickname: user?.nickname ?? "",
        };
      } catch {
        return {
          ...player,
          username: "",
          nickname: "",
        };
      }
    })
  );

  return enrichedPlayers;
}