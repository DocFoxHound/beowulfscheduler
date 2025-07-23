import axios from 'axios';
import { LeaderboardSBLog } from '../types/sb_leaderboard_log';

const API_BASE_URL = `${import.meta.env.VITE_IS_LIVE === "true" ? import.meta.env.VITE_LIVE_API_URL : import.meta.env.VITE_TEST_API_URL}`;

// GET all LeaderboardLog entries
export const fetchAllLeaderboardSBLogs = async (): Promise<LeaderboardSBLog[]> => {
  const response = await axios.get(`${API_BASE_URL}/api/leaderboardsblog/`);
  return response.data.map((entry: any) => ({
    ...entry,
    user_id: entry.user_id ? BigInt(entry.user_id) : undefined,
    score: entry.score ? BigInt(entry.score) : undefined,
    damage_dealt: entry.damage_dealt ? BigInt(entry.damage_dealt) : undefined,
    damage_taken: entry.damage_taken ? BigInt(entry.damage_taken) : undefined,
    created_at: entry.created_at ? BigInt(entry.created_at) : undefined,
  }));
};

// GET LeaderboardLog entry by User ID
export const fetchLeaderboardSBLogByUserId = async (userId: string | number): Promise<LeaderboardSBLog | null> => {
  const response = await axios.get(`${API_BASE_URL}/api/leaderboardsblog/user/${userId}`);
  if (!response.data) return null;
  const entry = response.data;
  return {
    ...entry,
    user_id: entry.user_id ? BigInt(entry.user_id) : undefined,
    score: entry.score ? BigInt(entry.score) : undefined,
    damage_dealt: entry.damage_dealt ? BigInt(entry.damage_dealt) : undefined,
    damage_taken: entry.damage_taken ? BigInt(entry.damage_taken) : undefined,
    created_at: entry.created_at ? BigInt(entry.created_at) : undefined,
  };
};

// GET all LeaderboardLog entries within a provided timespan
export const fetchLeaderboardSBLogsByTimespan = async (start: string, end: string): Promise<LeaderboardSBLog[]> => {
  const response = await axios.get(`${API_BASE_URL}/api/leaderboardsblog/timespan`, {
    params: { start, end }
  });
  return response.data.map((entry: any) => ({
    ...entry,
    user_id: entry.user_id ? BigInt(entry.user_id) : undefined,
    score: entry.score ? BigInt(entry.score) : undefined,
    damage_dealt: entry.damage_dealt ? BigInt(entry.damage_dealt) : undefined,
    damage_taken: entry.damage_taken ? BigInt(entry.damage_taken) : undefined,
    created_at: entry.created_at ? BigInt(entry.created_at) : undefined,
  }));
};
