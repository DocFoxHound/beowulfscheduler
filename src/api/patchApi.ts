import axios from 'axios';
import { Patch } from '../types/patch';


const API_BASE_URL = `${import.meta.env.VITE_IS_LIVE === "true" ? import.meta.env.VITE_LIVE_API_URL : import.meta.env.VITE_TEST_API_URL}`;

export const getLatestPatch = async (): Promise<Patch> => {
  const response = await axios.get<Patch>(`${API_BASE_URL}/api/gameversion/`);
  return response.data;
};

export const getAllGameVersions = async (): Promise<Patch[]> => {
  const response = await axios.get<Patch[]>(`${API_BASE_URL}/api/gameversion/`);
  return response.data;
};