import axios from 'axios';
import { BadgeAccoladeRecord } from '../types/badgeAccoladeRecord';

const API_BASE_URL = `${import.meta.env.VITE_IS_LIVE === "true" ? import.meta.env.VITE_LIVE_API_URL : import.meta.env.VITE_TEST_API_URL}`;

// Get all badge records
export const fetchAllBadgeAccoladess = async (): Promise<BadgeAccoladeRecord[]> => {
  const response = await axios.get<BadgeAccoladeRecord[]>(`${API_BASE_URL}/api/badgeaccolades/`);
  return response.data;
};

// Get all badges by user ID (query param: user_id)
export const fetchBadgeAccoladessById = async (id: string): Promise<BadgeAccoladeRecord[]> => {
  const response = await axios.get<BadgeAccoladeRecord[]>(`${API_BASE_URL}/api/badgeaccolades/id`, {
    params: { id: id }
  });
  return response.data;
};

// Get all badges by patch (query param: patch)
export const fetchBadgeAccoladessByPatch = async (patch: string): Promise<BadgeAccoladeRecord[]> => {
  const response = await axios.get<BadgeAccoladeRecord[]>(`${API_BASE_URL}/api/badgeaccolades/patch`, {
    params: { patch }
  });
  return response.data;
};

// Create a new badge record
export const createBadgeAccolade = async (badge: BadgeAccoladeRecord): Promise<BadgeAccoladeRecord> => {
  const response = await axios.post<BadgeAccoladeRecord>(`${API_BASE_URL}/api/badgeaccolades/`, badge);
  return response.data;
};

// Update an existing badge record by ID
export const updateBadgeAccolade = async (id: string, badge: Partial<BadgeAccoladeRecord>): Promise<BadgeAccoladeRecord> => {
  const response = await axios.put<BadgeAccoladeRecord>(`${API_BASE_URL}/api/badgeaccolades/${id}`, badge);
  return response.data;
};

// Delete a badge record by ID
export const deleteBadgeAccolade = async (id: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/api/badgeaccolades/${id}`);
}; 