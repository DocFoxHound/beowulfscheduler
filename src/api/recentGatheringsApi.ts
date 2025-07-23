import axios from 'axios';
import { RecentGathering } from '../types/recent_gatherings';

const API_BASE_URL = `${import.meta.env.VITE_IS_LIVE === "true" ? import.meta.env.VITE_LIVE_API_URL : import.meta.env.VITE_TEST_API_URL}`;

export const fetchAllRecentGatherings = async (): Promise<RecentGathering[]> => {
  const response = await axios.get<RecentGathering[]>(`${API_BASE_URL}/api/recentgatherings/`);
  return response.data;
};

export const fetchRecentGatheringsWithinTimeframe = async (start: string, end: string): Promise<RecentGathering[]> => {
  const response = await axios.get<RecentGathering[]>(
    `${API_BASE_URL}/api/recentgatherings/timeframe`,
    {
      params: { start, end }
    }
  );
  return response.data;
};

export const createRecentGathering = async (RecentGathering: RecentGathering): Promise<RecentGathering> => {
  const response = await axios.post<RecentGathering>(`${API_BASE_URL}/api/recentgatherings/`, RecentGathering);
  return response.data;
}

export const editRecentGathering = async (id: string, item: RecentGathering): Promise<RecentGathering> => {
  const response = await axios.put<RecentGathering>(
    `${API_BASE_URL}/api/recentgatherings/${id}`,
    item,
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
};

export const deleteRecentGathering = async (id: any): Promise<RecentGathering> => {
  const response = await axios.delete<RecentGathering>(`${API_BASE_URL}/api/recentgatherings/${id}`);
  return response.data;
}