import axios from 'axios';
import { BadgeRecord } from '../types/badgeRecord';

const API_BASE_URL = `${import.meta.env.VITE_IS_LIVE === "true" ? import.meta.env.VITE_LIVE_API_URL : import.meta.env.VITE_TEST_API_URL}`;

// Get all badge records
export const fetchAllBadges = async (): Promise<BadgeRecord[]> => {
  const response = await axios.get<BadgeRecord[]>(`${API_BASE_URL}/api/badges/`);
  return response.data;
};

// Get all badges by user ID (query param: user_id)
export const fetchBadgesByUserId = async (userId: string): Promise<BadgeRecord[]> => {
  const response = await axios.get<BadgeRecord[]>(`${API_BASE_URL}/api/badges/user`, {
    params: { user_id: userId }
  });
  return response.data;
};

// Get all badges by user ID (query param: user_id)
export const fetchBadgesByUserIdAndAccolade = async (userId: string): Promise<BadgeRecord[]> => {
  const response = await axios.get<BadgeRecord[]>(`${API_BASE_URL}/api/badges/userandaccolade`, {
    params: { user_id: userId }
  });
  return response.data;
};

// Get all badges by patch (query param: patch)
export const fetchBadgesByPatch = async (patch: string): Promise<BadgeRecord[]> => {
  const response = await axios.get<BadgeRecord[]>(`${API_BASE_URL}/api/badges/patch`, {
    params: { patch }
  });
  return response.data;
};

// Create a new badge record
export const createBadge = async (badge: BadgeRecord): Promise<BadgeRecord> => {
  const response = await axios.post<BadgeRecord>(`${API_BASE_URL}/api/badges/`, badge);
  return response.data;
};

// Update an existing badge record by ID
export const updateBadge = async (id: string, badge: Partial<BadgeRecord>): Promise<BadgeRecord> => {
  const response = await axios.put<BadgeRecord>(`${API_BASE_URL}/api/badges/${id}`, badge);
  return response.data;
};

// Delete a badge record by ID
export const deleteBadge = async (id: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/api/badges/${id}`);
}; 