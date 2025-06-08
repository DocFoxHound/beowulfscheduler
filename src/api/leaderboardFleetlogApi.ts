import axios from "axios";
import { getUserById } from "./userService";
import { fetchFleetById } from "./fleetApi";

const API_BASE_URL = `${import.meta.env.VITE_IS_LIVE === "true" ? import.meta.env.VITE_LIVE_API_URL : import.meta.env.VITE_TEST_API_URL}`;

// Updated FleetlogPlayer type
export interface FleetlogPlayer {
  id: bigint;
  patch: string;
  created_at: string[]; // array of timestamps with time zones
  command_times: number;
  air_sub_times: number;
  fps_sub_times: number;
  crew_times: number;
  favorite_fleet: string;
  favorite_fleet_id: bigint;
}

// Updated FleetlogPlayerEnriched type
export interface FleetlogPlayerEnriched extends FleetlogPlayer {
  username: string;
  nickname: string;
  fleet_avatar: string; // URL string
  total_activity: number; // sum of all activity times
}

// Get leaderboard for a specific patch
export async function fetchFleetlogLeaderboardByPatch(patch: string): Promise<FleetlogPlayer[]> {
  const response = await axios.get(`${API_BASE_URL}/api/leaderboardfleetlogsummary/patch/${encodeURIComponent(patch)}`);
  return response.data;
}

// Get stats for a specific player
export async function fetchFleetlogPlayerStats(player_id: string): Promise<FleetlogPlayer[]> {
  const response = await axios.get(`${API_BASE_URL}/api/leaderboardfleetlogsummary/player/${encodeURIComponent(player_id)}`);
  return response.data;
}

// Enrich leaderboard with user and fleet avatar info
export async function fetchFleetlogLeaderboardByPatchEnriched(patch: string): Promise<FleetlogPlayerEnriched[]> {
  const response = await fetchFleetlogLeaderboardByPatch(patch);
  const players: FleetlogPlayer[] = Array.isArray(response) ? response : [];

  const enrichedPlayers = await Promise.all(
    players.map(async (player) => {
      let username = "";
      let nickname = "";
      let fleet_avatar = "";

      try {
        const user = await getUserById(player.id.toString());
        username = user?.username ?? "";
        nickname = user?.nickname ?? "";
      } catch {
        // leave as empty string
      }

      try {
        if (player.favorite_fleet_id) {
          const fleetArr = await fetchFleetById(player.favorite_fleet_id.toString());
          if (Array.isArray(fleetArr) && fleetArr.length > 0) {
            fleet_avatar = fleetArr[0].avatar ?? "";
          }
        }
      } catch {
        // leave as empty string
      }

      return {
        ...player,
        username,
        nickname,
        fleet_avatar,
        total_activity: Number(player.command_times) + Number(player.air_sub_times) + Number(player.fps_sub_times + player.crew_times),
      };
    })
  );

  return enrichedPlayers;
}