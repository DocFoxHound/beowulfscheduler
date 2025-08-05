import axios from 'axios';
import { type Availability, type ScheduleEntry } from '../types/schedule';

const API_URL = `${import.meta.env.VITE_IS_LIVE === "true" ? import.meta.env.VITE_LIVE_API_URL : import.meta.env.VITE_TEST_API_URL}`;

/**
 * Fetches the user's schedule from the API
 * @returns Promise with the user's availability data
 */
// export const getSchedule = async (): Promise<Availability> => {
//   try {
//     const response = await axios.get(`${API_URL}/schedule/weekly`, {
//       withCredentials: true
//     });
//     return response.data;
//   } catch (error) {
//     console.error('Error fetching schedule:', error);
//     throw error;
//   }
// };

// export const getWeeklySchedule = async (startOfWeek: Date, endOfWeek: Date): Promise<Availability> => {
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

// Get weekly availabilities (by date range)
export const getWeeklySchedule = async (startDate: string, endDate: string) => {
  try {
    const response = await axios.get(`${API_URL}/api/schedule/weekly`, {
      params: { startDate, endDate },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching week availabilities:', error);
    throw error;
  }
};

/**
 * Saves the user's availability to the API
 * @param availability - The availability data to save (array of events)
 * @returns Promise with the saved availability data
 */
export const saveSchedule = async (availability: Availability): Promise<Availability> => {
  try {
    // Set .action to null on all availability objects before saving
    const cleaned = availability.map(a => ({ ...a, action: null }));

    const response = await axios.post(`${API_URL}/api/schedule`, cleaned, {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' }
    });
    return response.data;
  } catch (error) {
    console.error('Error saving schedule:', error);
    throw error;
  }
};

/**
 * Saves repeated schedule entries to the API
 * @param entry - The base schedule entry (should include repeat_end_date, repeat_frequency, start_time, etc.)
 * @returns Promise with the created repeated schedule entries
 */
export const saveScheduleRepeat = async (entry: ScheduleEntry): Promise<ScheduleEntry[]> => {
  try {
    const response = await axios.post(`${API_URL}/api/schedule/repeat`, entry, {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' }
    });
    return response.data;
  } catch (error) {
    console.error('Error saving repeated schedule:', error);
    throw error;
  }
};

/**
 * Updates a schedule entry by ID
 * @param id - The schedule entry ID
 * @param data - The updated schedule entry data
 * @returns Promise with the updated schedule entry
 */
export const updateSchedule = async (
  id: number,
  data: Partial<ScheduleEntry>,
  notify: boolean
): Promise<ScheduleEntry> => {
  try {
    const response = await axios.put(
      `${API_URL}/schedule/${id}`,
      { ...data, notify }, // Add notify to the body
      {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating schedule:', error);
    throw error;
  }
};

/**
 * Fetches the next upcoming schedule entry for a given repeat_series
 * @param repeatSeries - The repeat_series ID
 * @returns Promise with the next schedule entry or null if not found
 */
export const getNextScheduleByRepeatSeries = async (repeatSeries: string) => {
  try {
    const response = await axios.get(`${API_URL}/api/schedule/repeatseries/${repeatSeries}/next`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      return null; // No upcoming schedule found
    }
    console.error('Error fetching next schedule by repeat_series:', error);
    throw error;
  }
};

export const deleteSeries = async (repeatSeries: string): Promise<void> => {
  try {
    await axios.delete(`${API_URL}/api/schedule/repeatseries/${repeatSeries}`, {
      withCredentials: true,
    });
  } catch (error) {
    console.error('Error deleting schedule series:', error);
    throw error;
  }
};