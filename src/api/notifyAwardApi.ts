import axios from 'axios';

const API_BASE_URL = `${import.meta.env.VITE_IS_LIVE === "true" ? import.meta.env.VITE_LIVE_API_URL : import.meta.env.VITE_TEST_API_URL}`;


// Notify a user about an award
export const notifyAward = async (
  badgeName: string,
  badgeDescription: string,
  userName: string,
  userId: string
): Promise<any> => {
  const payload = { badgeName, badgeDescription, userName, userId };
  const response = await axios.post(`${API_BASE_URL}/api/notifyaward/`, payload);
  return response.data;
};
