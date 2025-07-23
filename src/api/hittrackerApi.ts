import axios from 'axios';
import { Hit } from '../types/hittracker';
import { WarehouseItem } from '../types/warehouse';

const API_BASE_URL = `${import.meta.env.VITE_IS_LIVE === "true" ? import.meta.env.VITE_LIVE_API_URL : import.meta.env.VITE_TEST_API_URL}`;

interface Coupling {
  user_id: string | null;
  gameVersion: string | null;
}

export const fetchPlayerRecentPirateHits = async (coupling: Coupling): Promise<Hit[]> => {
  const response = await axios.get<Hit[]>(`${API_BASE_URL}/api/hittracker/userandpatch`, {
    params: {
      user_id: coupling.user_id,
      patch: coupling.gameVersion,
    },
  });
  return response.data;
};

export const fetchAllPlayerPirateHits = async (coupling: Coupling): Promise<Hit[]> => {
  const response = await axios.get<Hit[]>(`${API_BASE_URL}/api/hittracker/user`, {
    params: {
      user_id: coupling.user_id,
    },
  });
  return response.data;
};

export const fetchAllPlayerAssistHits = async (coupling: Coupling): Promise<Hit[]> => {
  const response = await axios.get<Hit[]>(`${API_BASE_URL}/api/hittracker/assists`, {
    params: {
      user_id: coupling.user_id,
    },
  });
  return response.data;
};

export const fetchRecentOtherHits = async (): Promise<Hit[]> => {
  const response = await axios.get<Hit[]>(`${API_BASE_URL}/api/hittracker/latest`);
  return response.data;
};

export const fetchLatest100Hits = async (): Promise<Hit[]> => {
  const response = await axios.get<Hit[]>(`${API_BASE_URL}/api/hittracker/latest100`);
  return response.data;
};

export const createHit = async (hit: Hit): Promise<Hit> => {
  console.log("Creating hit:", hit);
  const response = await axios.post<Hit>(`${API_BASE_URL}/api/hittracker/`, hit);
  return response.data;
};

export const updateHit = async (hit: Hit): Promise<Hit> => {
  console.log("Updating hit:", hit);
  const response = await axios.put<Hit>(`${API_BASE_URL}/api/hittracker/${hit.id}`, hit);
  return response.data;
};

export const deleteHit = async (hit: Hit): Promise<void> => {
  console.log("Deleting hit:", hit);
  await axios.delete(`${API_BASE_URL}/api/hittracker/${hit}`, { data: hit });
};

export const fetchHitEntryCount = async (): Promise<number> => {
  const response = await axios.get<{ count: number }>(`${API_BASE_URL}/api/hittracker/count`);
  return response.data.count;
};

export const fetchTotalValueStolenSum = async (): Promise<number> => {
  const response = await axios.get<{ total_sum: number }>(`${API_BASE_URL}/api/hittracker/totalsum`);
  return response.data.total_sum;
};

export const fetchTop10TotalCutValueByPatch = async (patch: string): Promise<{ user_id: string, total_cut_sum: number }[]> => {
  const response = await axios.get<{ user_id: string, total_cut_sum: number }[]>(`${API_BASE_URL}/api/hittracker/top10totalcutvalue`, {
    params: { patch }
  });
  return response.data;
};

export const fetchAllHitsByPatch = async (patch: string): Promise<Hit[]> => {
  const response = await axios.get<Hit[]>(`${API_BASE_URL}/api/hittracker/patch`, {
    params: { patch }
  });
  return response.data;
};

export const fetchAllHitsByUserIdAndPatch = async (user_id: string, patch: string): Promise<Hit[]> => {
  const response = await axios.get<Hit[]>(`${API_BASE_URL}/api/hittracker/userandpatch`, {
    params: { user_id, patch }
  });
  return response.data;
};


/**
 * Fetch all hitTracker entries between a timeframe.
 * @param start ISO string or date string for start of timeframe
 * @param end ISO string or date string for end of timeframe
 * @returns Array of Hit objects
 */
export const fetchHitsByTimeframe = async (start: string, end: string): Promise<Hit[]> => {
  const response = await axios.get<Hit[]>(`${API_BASE_URL}/api/hittracker/timeframe`, {
    params: { start, end }
  });
  return response.data;
};

/**
 * Fetch org overview summary for all patches.
 * @returns The overview summary array from the backend (raw JSON from Postgres view)
 */
export const fetchOrgOverviewSummaryByPatch = async (): Promise<any[]> => {
  const response = await axios.get<any[]>(`${API_BASE_URL}/api/hittracker/hitoverviewbypatch`);
  return response.data;
};

