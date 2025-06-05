import axios from 'axios';
import { UserFleet } from '../types/fleet';

const API_BASE_URL = `${import.meta.env.VITE_IS_LIVE === "true" ? import.meta.env.VITE_LIVE_API_URL : import.meta.env.VITE_TEST_API_URL}`;

interface Coupling {
  user_id: string | null;
  gameVersion: string | null;
}

export const fetchAllFleets = async (): Promise<UserFleet[]> => {
  const response = await axios.get<UserFleet[]>(`${API_BASE_URL}/api/fleet/`);
  return response.data;
};

// export const fetchPlayerRecentPirateUserFleets = async (coupling: Coupling): Promise<UserFleet[]> => {
//   const response = await axios.get<UserFleet[]>(`${API_BASE_URL}/api/fleet/userandpatch`, {
//     params: {
//       user_id: coupling.user_id,
//       patch: coupling.gameVersion,
//     },
//   });
//   return response.data;
// };

export const fetchPlayerFleet = async (user_id: string): Promise<UserFleet[]> => {
  const response = await axios.get<UserFleet[]>(`${API_BASE_URL}/api/fleet/commander`, {
    params: {
      user_id: user_id,
    },
  });
  return response.data;
};

export const fetchFleetById = async (fleet_id: string): Promise<UserFleet[]> => {
  const response = await axios.get<UserFleet[]>(`${API_BASE_URL}/api/fleet/fleet`, {
    params: {
      id: fleet_id,
    },
  });
  return response.data;
};

export const fetchFleetByMember = async (user_id: string): Promise<UserFleet | null> => {
  try {
    const response = await axios.get<UserFleet>(`${API_BASE_URL}/api/fleet/members`, {
      params: { user_id }
    });
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

export const fetchFleetActiveOrNot = async (activeOrNot: boolean): Promise<UserFleet[]> => {
  const response = await axios.get<UserFleet[]>(`${API_BASE_URL}/api/fleet/activeornot`, {
    params: {
      activeOrNot: activeOrNot,
    },
  });
  return response.data;
};

export const createFleet = async (fleet: UserFleet): Promise<UserFleet> => {
  const response = await axios.post<UserFleet>(`${API_BASE_URL}/api/fleet/`, fleet);
  return response.data;
}

export const editFleet = async (id: string, item: UserFleet): Promise<UserFleet> => {
  const response = await axios.put<UserFleet>(
    `${API_BASE_URL}/api/fleet/${id}`,
    item,
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
};