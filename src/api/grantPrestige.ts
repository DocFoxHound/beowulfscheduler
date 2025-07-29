import axios from 'axios';

const API_BASE_URL = `${import.meta.env.VITE_IS_LIVE === "true" ? import.meta.env.VITE_LIVE_API_URL : import.meta.env.VITE_TEST_API_URL}`;

// Grant prestige to a player
export const grantPrestige = async (
  playerId: string,
  prestigeName: string,
  prestigeLevel: number
): Promise<void> => {
  await axios.post(`${API_BASE_URL}/api/grantprestige/`, {
    user_id: playerId,
    prestige_name: prestigeName,
    prestige_level: prestigeLevel,
  });
};
