import axios from 'axios';
import type { Systems } from '../types/uex_systems';

const API_BASE_URL = `${import.meta.env.VITE_IS_LIVE === "true" ? import.meta.env.VITE_LIVE_API_URL : import.meta.env.VITE_TEST_API_URL}`;

/**
 * Fetch all UexSystems from the backend API
 */
export async function fetchAllUexSystems(): Promise<Systems> {
  const response = await axios.get<Systems>(`${API_BASE_URL}/api/uex/starsystems/`);
  return response.data;
}