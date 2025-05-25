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
  const response = await axios.post<Hit>(`${API_BASE_URL}/api/hittracker/`, hit);
  return response.data;
};

export const updateHit = async (hit: Hit): Promise<Hit> => {
  const response = await axios.put<Hit>(`${API_BASE_URL}/api/hittracker/${hit.id}`, hit);
  return response.data;
};

export const deleteHit = async (id: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/api/hittracker/${id}`);
};