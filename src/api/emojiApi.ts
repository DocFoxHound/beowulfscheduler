import axios from 'axios';
import { Emoji } from '../types/emoji';

const API_BASE_URL = `${import.meta.env.VITE_IS_LIVE === "true" ? import.meta.env.VITE_LIVE_API_URL : import.meta.env.VITE_TEST_API_URL}`;

// Get all emojis
export const fetchAllEmojis = async (): Promise<Emoji[]> => {
  const response = await axios.get<Emoji[]>(`${API_BASE_URL}/api/emojis/`);
  return response.data;
};
