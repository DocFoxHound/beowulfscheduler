import axios from 'axios';
import { RecentGang } from '../types/recent_gangs';

const API_BASE_URL = `${import.meta.env.VITE_IS_LIVE === "true" ? import.meta.env.VITE_LIVE_API_URL : import.meta.env.VITE_TEST_API_URL}`;

export const fetchAllRecentGangs = async (): Promise<RecentGang[]> => {
  const response = await axios.get<RecentGang[]>(`${API_BASE_URL}/api/recentfleets/`);
  return response.data;
};

export const fetchRecentGangsByPatch = async (patch: string): Promise<RecentGang[]> => {
  const response = await axios.get<RecentGang[]>(
    `${API_BASE_URL}/api/recentfleets/patch`,
    { params: { patch } }
  );
  return response.data;
};

export const fetchRecentGangsWithinTimeframe = async (start: string, end: string): Promise<RecentGang[]> => {
  const response = await axios.get<RecentGang[]>(
    `${API_BASE_URL}/api/recentfleets/timeframe`,
    {
      params: { start, end }
    }
  );
  return response.data;
};

export const createRecentFleet = async (RecentFleet: RecentGang): Promise<RecentGang> => {
  const response = await axios.post<RecentGang>(`${API_BASE_URL}/api/recentfleets/`, RecentFleet);
  return response.data;
}

export const editRecentFleet = async (id: string, item: RecentGang): Promise<RecentGang> => {
  const response = await axios.put<RecentGang>(
    `${API_BASE_URL}/api/recentfleets/${id}`,
    item,
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
};

export const deleteRecentFleet = async (id: any): Promise<RecentGang> => {
  const response = await axios.delete<RecentGang>(`${API_BASE_URL}/api/recentfleets/${id}`);
  return response.data;
};

export const fetchRecentGangsSummary = async (
  patch?: string,
  limit: number = 500,
  offset: number = 0
): Promise<any[]> => {
  const params: any = { limit, offset };
  if (patch) params.patch = patch;

  const response = await axios.get<any[]>(
    `${API_BASE_URL}/api/recentfleets/usersummary`, ///api/recentfleets/usersummary
    { params }
  );
  return response.data;
};