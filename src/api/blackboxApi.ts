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

export const fetchACGameModeCount = async (): Promise<number> => {
  const response = await axios.get<{ count: number }>(`${API_BASE_URL}/api/blackbox/acgamemodecount`);
  return response.data.count;
};

export const fetchPUGameModeCount = async (): Promise<number> => {
  const response = await axios.get<{ count: number }>(`${API_BASE_URL}/api/blackbox/pugamemodecount`);
  return response.data.count;
};

export const fetchShipKillCount = async (): Promise<number> => {
  const response = await axios.get<{ count: number }>(`${API_BASE_URL}/api/blackbox/shipkillcount`);
  return response.data.count;
};

export const fetchFPSKillCount = async (): Promise<number> => {
  const response = await axios.get<{ count: number }>(`${API_BASE_URL}/api/blackbox/fpskillcount`);
  return response.data.count;
};

export const fetchTotalValueDestroyedSum = async (): Promise<number> => {
  const response = await axios.get<{ total_sum: number }>(`${API_BASE_URL}/api/blackbox/totalsum`);
  return response.data.total_sum;
};

export const fetchTop10ACShipKillersByPatch = async (patch: string): Promise<any[]> => {
  const response = await axios.get<any[]>(`${API_BASE_URL}/api/blackbox/top10acshipkillers`, {
    params: { patch }
  });
  return response.data;
};

export const fetchTop10ACFPSKillersByPatch = async (patch: string): Promise<any[]> => {
  const response = await axios.get<any[]>(`${API_BASE_URL}/api/blackbox/top10acfpskillers`, {
    params: { patch }
  });
  return response.data;
};

export const fetchTop10PUShipKillersByPatch = async (patch: string): Promise<any[]> => {
  const response = await axios.get<any[]>(`${API_BASE_URL}/api/blackbox/top10pushipkillers`, {
    params: { patch }
  });
  return response.data;
};

export const fetchTop10PUFPSKillersByPatch = async (patch: string): Promise<any[]> => {
  const response = await axios.get<any[]>(`${API_BASE_URL}/api/blackbox/top10pufpskillers`, {
    params: { patch }
  });
  return response.data;
};

// Get all FPS kills by patch
export const fetchAllFPSKillsByPatch = async (patch: string): Promise<BlackBox[]> => {
  const response = await axios.get<BlackBox[]>(`${API_BASE_URL}/api/blackbox/allfpskillsbypatch`, {
    params: { patch }
  });
  return response.data;
};

// Get all ship kills by patch (excluding FPS)
export const fetchAllShipKillsByPatch = async (patch: string): Promise<BlackBox[]> => {
  const response = await axios.get<BlackBox[]>(`${API_BASE_URL}/api/blackbox/allshipkillsbypatch`, {
    params: { patch }
  });
  return response.data;
};

// Get newest 100 FPS kills by patch
export const fetchNewest100FPSKillsByPatch = async (patch: string): Promise<BlackBox[]> => {
  const response = await axios.get<BlackBox[]>(`${API_BASE_URL}/api/blackbox/newest100fpskillsbypatch`, {
    params: { patch }
  });
  return response.data;
};

// Get newest 100 ship kills by patch (excluding FPS)
export const fetchNewest100ShipKillsByPatch = async (patch: string): Promise<BlackBox[]> => {
  const response = await axios.get<BlackBox[]>(`${API_BASE_URL}/api/blackbox/newest100shipkillsbypatch`, {
    params: { patch }
  });
  return response.data;
};