import axios from 'axios';
import type { Stations } from '../types/uex_stations';

const API_BASE_URL = `${import.meta.env.VITE_IS_LIVE === "true" ? import.meta.env.VITE_LIVE_API_URL : import.meta.env.VITE_TEST_API_URL}`;

/**
 * Fetch all UexSystems from the backend API
 */
export async function fetchAllUexSystems(): Promise<Stations> {
  const response = await axios.get<Stations>(`${API_BASE_URL}/api/uex/spacestations/`);
  return response.data;
}