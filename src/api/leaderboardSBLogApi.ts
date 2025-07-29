import axios from 'axios';
import { LeaderboardSBLog } from '../types/sb_leaderboard_log';

const API_BASE_URL = `${import.meta.env.VITE_IS_LIVE === "true" ? import.meta.env.VITE_LIVE_API_URL : import.meta.env.VITE_TEST_API_URL}`;

// GET all LeaderboardLog entries
export const fetchAllLeaderboardSBLogs = async (): Promise<LeaderboardSBLog[]> => {
  const response = await axios.get(`${API_BASE_URL}/api/leaderboardsblog/`);
  return response.data;
};

// GET LeaderboardLog entry by User ID
export const fetchLeaderboardSBLogByUserId = async (userId: string | number): Promise<LeaderboardSBLog | null> => {
  const response = await axios.get(`${API_BASE_URL}/api/leaderboardsblog/user/${userId}`);
  if (!response.data) return null;
  return response.data;
};

// GET all LeaderboardLog entries within a provided timespan
export const fetchLeaderboardSBLogsByTimespan = async (start: string, end: string): Promise<LeaderboardSBLog[]> => {
  try{
    const response = await axios.get(`${API_BASE_URL}/api/leaderboardsblog/timespan`, {
      params: { start: start, end: end }
    });
    return response.data;
  }catch (error) {
    console.error("Error fetching leaderboard logs by timespan:", error);
    return [];
  }
};
