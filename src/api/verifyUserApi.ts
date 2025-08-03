import axios from 'axios';

const API_BASE_URL = `${import.meta.env.VITE_IS_LIVE === "true" ? import.meta.env.VITE_LIVE_API_URL : import.meta.env.VITE_TEST_API_URL}`;

// Grant prestige to a player
export const verifyUser = async (
  userId: string,
  handle: string
): Promise<any> => {
  const response = await axios.post(`${API_BASE_URL}/api/verifyuser/`, {
    userId,
    handle,
  });
  return response.data;
};
