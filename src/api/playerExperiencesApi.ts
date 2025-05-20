import axios from 'axios';
import { PlayerExperience } from '../types/player_experiences';

const API_BASE_URL = `${import.meta.env.VITE_IS_LIVE === "true" ? import.meta.env.VITE_LIVE_API_URL : import.meta.env.VITE_TEST_API_URL}`;

export const fetchAllPlayerExperiences = async (): Promise<PlayerExperience[]> => {
  const response = await axios.get<PlayerExperience[]>(`${API_BASE_URL}/api/playerexperience/`);
  return response.data;
};

export const fetchPlayerExperiencesByUserId = async (user_id: string): Promise<PlayerExperience[]> => {
  const response = await axios.get<PlayerExperience[]>(`${API_BASE_URL}/api/playerexperience/user`, {
    params: { user_id }
  });
  return response.data;
};

export const createPlayerExperience = async (PlayerExperience: PlayerExperience): Promise<PlayerExperience> => {
  const response = await axios.post<PlayerExperience>(`${API_BASE_URL}/api/playerexperience/`, PlayerExperience);
  return response.data;
}

export const editPlayerExperience = async (id: string, item: PlayerExperience): Promise<PlayerExperience> => {
  const response = await axios.put<PlayerExperience>(
    `${API_BASE_URL}/api/playerexperience/${id}`,
    item,
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
};

export const deletePlayerExperience = async (id: any): Promise<PlayerExperience> => {
  const response = await axios.delete<PlayerExperience>(`${API_BASE_URL}/api/playerexperience/${id}`);
  return response.data;
}