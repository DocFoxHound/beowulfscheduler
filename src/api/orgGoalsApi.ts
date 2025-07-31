import axios from 'axios';
import { OrgGoals } from '../types/orgGoals';

const API_BASE_URL = `${import.meta.env.VITE_IS_LIVE === "true" ? import.meta.env.VITE_LIVE_API_URL : import.meta.env.VITE_TEST_API_URL}`;

// Get all badge reusables
export const fetchAllOrgGoals = async (): Promise<OrgGoals[]> => {
  const response = await axios.get<OrgGoals[]>(`${API_BASE_URL}/api/orggoals/`);
  return response.data;
};

// Get all active badge reusables
export const fetchAllActiveOrgGoals = async (): Promise<OrgGoals[]> => {
  const response = await axios.get<OrgGoals[]>(`${API_BASE_URL}/api/orggoals/active`);
  return response.data;
};

// Get all badges by user ID (query param must be 'id' to match backend)
export const fetchOrgGoalsById = async (userId: string): Promise<OrgGoals[]> => {
  const response = await axios.get<OrgGoals[]>(`${API_BASE_URL}/api/orggoals/id`, {
    params: { id: userId }
  });
  return response.data;
};

// Create a new badge reusable
export const createOrgGoal = async (badge: OrgGoals): Promise<OrgGoals> => {
  const response = await axios.post<OrgGoals>(`${API_BASE_URL}/api/orggoals/`, badge);
  return response.data;
};

// Update an existing badge reusable by ID
export const updateOrgGoal = async (id: string, badge: Partial<OrgGoals>): Promise<OrgGoals> => {
  const response = await axios.put<OrgGoals>(`${API_BASE_URL}/api/orggoals/${id}`, badge);
  return response.data;
};

// Delete a badge reusable by ID
export const deleteOrgGoal = async (id: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/api/orggoals/${id}`);
};