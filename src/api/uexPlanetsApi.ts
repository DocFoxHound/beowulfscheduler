import axios from 'axios';
import type { Planets } from '../types/uex_planets';

const API_BASE_URL = `${import.meta.env.VITE_IS_LIVE === "true" ? import.meta.env.VITE_LIVE_API_URL : import.meta.env.VITE_TEST_API_URL}`;

/**
 * Fetch all UexSystems from the backend API
 */
export async function fetchAllUexSystems(): Promise<Planets> {
  const response = await axios.get<Planets>(`${API_BASE_URL}/api/uex/planets/`);
  return response.data;
}