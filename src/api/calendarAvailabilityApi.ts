import axios from 'axios';
import { Availability } from '../types/calendarAvailability';

const API_URL = `${import.meta.env.VITE_IS_LIVE === "true" ? import.meta.env.VITE_LIVE_API_URL : import.meta.env.VITE_TEST_API_URL}`;

// Get all availabilities
export const getAllAvailability = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/calendaravailability`, { withCredentials: true });
    return response.data;
  } catch (error) {
    console.error('Error fetching all availability:', error);
    throw error;
  }
};

// Get weekly availabilities (by date range)
export const getWeekAvailabilities = async (startDate: string, endDate: string) => {
  try {
    const response = await axios.get(`${API_URL}/api/calendaravailability/weekly`, {
      params: { startDate, endDate },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching week availabilities:', error);
    throw error;
  }
};

// Get availabilities by user ID
export const getAvailabilityByUserId = async (userId: string) => {
  try {
    const response = await axios.get(`${API_URL}/api/calendaravailability/user`, {
      params: { user_id: userId },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching availability by user ID:', error);
    throw error;
  }
};

// Get availabilities by patch
export const getAvailabilityByPatch = async (patch: string) => {
  try {
    const response = await axios.get(`${API_URL}/api/calendaravailability/patch`, {
      params: { patch },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching availability by patch:', error);
    throw error;
  }
};

// // Create new availability
// export const createAvailability = async (availabilityData: any) => {
//   try {
//     const response = await axios.post(`${API_URL}/api/calendaravailability`, availabilityData, {
//       withCredentials: true,
//     });
//     return response.data;
//   } catch (error) {
//     console.error('Error creating availability:', error);
//     throw error;
//   }
// };

// Create a new badge record
export const createAvailability = async (availability: Availability): Promise<Availability> => {
  console.log("Creating availability:", availability);
  const response = await axios.post<Availability>(`${API_URL}/api/calendaravailability/`, availability);
  return response.data;
};

// Update availability by ID
export const updateAvailability = async (id: string, updateData: any) => {
  try {
    const response = await axios.put(`${API_URL}/api/calendaravailability/${id}`, updateData, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error updating availability:', error);
    throw error;
  }
};

// Delete availability by ID
export const deleteAvailability = async (id: string) => {
  try {
    const response = await axios.delete(`${API_URL}/api/calendaravailability/${id}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting availability:', error);
    throw error;
  }
};


