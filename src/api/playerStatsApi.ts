import axios from 'axios';
import { PlayerStats } from '../types/player_stats';

const API_BASE_URL = `${import.meta.env.VITE_IS_LIVE === "true" ? import.meta.env.VITE_LIVE_API_URL : import.meta.env.VITE_TEST_API_URL}`;

// Get all player stats
export const fetchAllPlayerStats = async (): Promise<PlayerStats[]> => {
  const response = await axios.get<PlayerStats[]>(`${API_BASE_URL}/api/playerstats/`);
  return response.data;
};

// Get player stats by user_id
export const fetchPlayerStatsByUserId = async (userId: string): Promise<PlayerStats | null> => {
  try {
    const response = await axios.get<PlayerStats>(`${API_BASE_URL}/api/playerstats/${userId}`);
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      return null;
    }
    throw error;
  }
};

// Refresh the player_stats materialized view
export const refreshPlayerStatsView = async (): Promise<{ message: string }> => {
  const response = await axios.post<{ message: string }>(`${API_BASE_URL}/api/playerstats/refresh`);
  return response.data;
};

