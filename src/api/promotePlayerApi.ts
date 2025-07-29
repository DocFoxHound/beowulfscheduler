import axios from 'axios';

const API_BASE_URL = `${import.meta.env.VITE_IS_LIVE === "true" ? import.meta.env.VITE_LIVE_API_URL : import.meta.env.VITE_TEST_API_URL}`;

// Promote a player
export const promotePlayer = async (playerId: string): Promise<void> => {
  await axios.post(`${API_BASE_URL}/api/promoteplayer/`, { user_id: playerId });
};
