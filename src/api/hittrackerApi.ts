import axios from 'axios';
import { Hit } from '../types/hittracker';
import { WarehouseItem } from '../types/warehouse';

const API_BASE_URL = `${import.meta.env.VITE_IS_LIVE === "true" ? import.meta.env.VITE_LIVE_API_URL : import.meta.env.VITE_TEST_API_URL}`;

interface Coupling {
  user_id: string | null;
  gameVersion: string | null;
}

export const fetchRecentPirateHits = async (coupling: Coupling): Promise<Hit[]> => {
  const response = await axios.get<Hit[]>(`${API_BASE_URL}/api/hittracker/userandpatch`, {
    params: {
      user_id: coupling.user_id,
      patch: coupling.gameVersion,
    },
  });
  return response.data;
};

export const fetchRecentOtherHits = async (): Promise<Hit[]> => {
  const response = await axios.get<Hit[]>(`${API_BASE_URL}/api/hittracker/latest`);
  return response.data;
};