import axios from 'axios';
import { type User } from '../types/user';

const API_URL = `${import.meta.env.VITE_IS_LIVE === "true" ? import.meta.env.VITE_LIVE_API_URL : import.meta.env.VITE_TEST_API_URL}`;

/**
 * Fetches the user's schedule from the API
 * @returns Promise with the user's User data
 */
export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const response = await axios.get(`${API_URL}/api/users/${userId}`, {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};

export const getAllUsers = async (): Promise<User | null> => {
  try {
    const response = await axios.get(`${API_URL}/api/users/`, {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};

export const getUserRank = async (rankId: string): Promise<User | null> => {
  try {
    const response = await axios.get(`${API_URL}/api/ranks/${rankId}`, {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching rank:', error);
    throw error;
  }
};

// export const getWeeklySchedule = async (startOfWeek: Date, endOfWeek: Date): Promise<User> => {
//   console.log("Fetching weekly schedule from", startOfWeek, "to", endOfWeek);
//   try {
//     const response = await axios.get(`${API_URL}/schedule`, {
//       params: {
//         start: startOfWeek.toISOString(),
//         end: endOfWeek.toISOString(),
//       },
//       withCredentials: true,
//     });
//     return response.data;
//   } catch (error) {
//     console.error('Error fetching weekly schedule:', error);
//     throw error;
//   }
// };

// /**
//  * Saves the user's User to the API
//  * @param User - The User data to save
//  * @returns Promise with the saved User data
//  */
// export const saveSchedule = async (User: User): Promise<User> => {
//   console.log("Saving schedule:", User);
//   try {
//     const results = await Promise.all(
//       User.map(async (item) => {
//         if (item.action === "add") {
//           item.action = "";
//           console.log("Item:", item);
//           // POST to create new User
//           //create new User entry
//           const response = await axios.post(`${API_URL}/schedule`, item, {
//             withCredentials: true,
//             headers: { 'Content-Type': 'application/json' }
//           });
//           return response.data;
//         } else if (item.action === "delete") {
//           // DELETE by id or timestamp
//           const itemById = await axios.get(`${API_URL}/schedule/${item.id}`, {
//             withCredentials: true,
//           });
//           const response = await axios.delete(`${API_URL}/schedule/${item.id}`, {
//             withCredentials: true,
//           });
//           return { ...item, deleted: true };
//         } else if (item.action === "update") {
//           item.action = "";
//           // PUT or PATCH to update existing User
//           const response = await axios.put(`${API_URL}/schedule/${item.id}`, item, {
//             withCredentials: true,
//             headers: { 'Content-Type': 'application/json' }
//           });
//           return response.data;
//         } else {
//           // Unknown action, skip or throw error
//           return null;
//         }
//       })
//     );
//     // Filter out nulls and deleted items if needed
//     return results.filter(Boolean) as User;
//   } catch (error) {
//     console.error('Error saving schedule:', error);
//     throw error;
//   }
// };