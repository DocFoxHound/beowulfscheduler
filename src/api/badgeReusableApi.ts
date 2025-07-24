import axios from 'axios';
import { BadgeReusable } from '../types/badgeReusable';

const API_BASE_URL = `${import.meta.env.VITE_IS_LIVE === "true" ? import.meta.env.VITE_LIVE_API_URL : import.meta.env.VITE_TEST_API_URL}`;

// Get all badge reusables
export const fetchAllBadgeReusables = async (): Promise<BadgeReusable[]> => {
  const response = await axios.get<BadgeReusable[]>(`${API_BASE_URL}/api/badgereusables/`);
  return response.data;
};

// Get all active badge reusables
export const fetchAllActiveBadgeReusables = async (): Promise<BadgeReusable[]> => {
  const response = await axios.get<BadgeReusable[]>(`${API_BASE_URL}/api/badgereusables/active`);
  return response.data;
};

// Get all badges by user ID (query param must be 'id' to match backend)
export const fetchBadgeReusablesById = async (userId: string): Promise<BadgeReusable[]> => {
  const response = await axios.get<BadgeReusable[]>(`${API_BASE_URL}/api/badgereusables/id`, {
    params: { id: userId }
  });
  return response.data;
};

// Create a new badge reusable
export const createBadgeReusable = async (badge: BadgeReusable): Promise<BadgeReusable> => {
  const response = await axios.post<BadgeReusable>(`${API_BASE_URL}/api/badgereusables/`, badge);
  return response.data;
};

// Update an existing badge reusable by ID
export const updateBadgeReusable = async (id: string, badge: Partial<BadgeReusable>): Promise<BadgeReusable> => {
  const response = await axios.put<BadgeReusable>(`${API_BASE_URL}/api/badgereusables/${id}`, badge);
  return response.data;
};

// Delete a badge reusable by ID
export const deleteBadgeReusable = async (id: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/api/badgereusables/${id}`);
};