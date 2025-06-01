import axios from 'axios';
import { BlackBox } from '../types/blackbox';

const API_BASE_URL = `${import.meta.env.VITE_IS_LIVE === "true" ? import.meta.env.VITE_LIVE_API_URL : import.meta.env.VITE_TEST_API_URL}`;

export const fetchAllBlackBoxs = async (): Promise<BlackBox[]> => {
  const response = await axios.get<BlackBox[]>(`${API_BASE_URL}/api/blackbox/`);
  return response.data;
};

export const fetchBlackBoxsByUserId = async (user_id: string): Promise<BlackBox[]> => {
  const response = await axios.get<BlackBox[]>(`${API_BASE_URL}/api/blackbox/user`, {
    params: { user_id }
  });
  return response.data;
};

export const fetchBlackBoxsByUserIdAndPatch = async (user_id: string, patch: string): Promise<BlackBox[]> => {
  const response = await axios.get<BlackBox[]>(`${API_BASE_URL}/api/blackbox/userandpatch`, {
    params: { user_id, patch }
  });
  return response.data;
};

export const fetchBlackBoxsByUserIdPatchGameMode = async (
  user_id: string,
  patch: string,
  game_mode: string
): Promise<BlackBox[]> => {
  const response = await axios.get<BlackBox[]>(`${API_BASE_URL}/api/blackbox/userpatchgamemode`, {
    params: { user_id, patch, game_mode }
  });
  return response.data;
};

export const createBlackBox = async (BlackBox: BlackBox): Promise<BlackBox> => {
  const response = await axios.post<BlackBox>(`${API_BASE_URL}/api/blackbox/`, BlackBox);
  return response.data;
}

export const editBlackBox = async (id: string, item: BlackBox): Promise<BlackBox> => {
  const response = await axios.put<BlackBox>(
    `${API_BASE_URL}/api/BlackBox/${id}`,
    item,
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
};

export const deleteBlackBox = async (id: any): Promise<BlackBox> => {
  const response = await axios.delete<BlackBox>(`${API_BASE_URL}/api/blackbox/${id}`);
  return response.data;
};

export const fetchUserKillsBeforeTimestamp = async (
  user_id: string,
  timestamp: string
): Promise<BlackBox[]> => {
  const response = await axios.get<BlackBox[]>(`${API_BASE_URL}/api/blackbox/userkillsbefore`, {
    params: { user_id, timestamp }
  });
  return response.data;
};

export const fetchBlackBoxesBetweenTimestamps = async (
  start: string,
  end: string
): Promise<BlackBox[]> => {
  const response = await axios.get<BlackBox[]>(`${API_BASE_URL}/api/blackbox/between`, {
    params: { start, end }
  });
  return response.data;
};