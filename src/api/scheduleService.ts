import axios from 'axios';
import { type Availability } from '../types/schedule';

const API_URL = `${import.meta.env.VITE_IS_LIVE === "true" ? import.meta.env.VITE_LIVE_API_URL : import.meta.env.VITE_TEST_API_URL}`;

/**
 * Fetches the user's schedule from the API
 * @returns Promise with the user's availability data
 */
export const getSchedule = async (): Promise<Availability> => {
  try {
    const response = await axios.get(`${API_URL}/schedule/weekly`, {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching schedule:', error);
    throw error;
  }
};

export const getWeeklySchedule = async (startOfWeek: Date, endOfWeek: Date): Promise<Availability> => {
  console.log("Fetching weekly schedule from", startOfWeek, "to", endOfWeek);
  try {
    const response = await axios.get(`${API_URL}/schedule`, {
      params: {
        start: startOfWeek.toISOString(),
        end: endOfWeek.toISOString(),
      },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching weekly schedule:', error);
    throw error;
  }
};

/**
 * Saves the user's availability to the API
 * @param availability - The availability data to save
 * @returns Promise with the saved availability data
 */
export const saveSchedule = async (availability: Availability): Promise<Availability> => {
  console.log("Saving schedule:", availability);
  try {
    const results = await Promise.all(
      availability.map(async (item) => {
        if (item.action === "add") {
          item.action = "";
          console.log("Item:", item);
          // POST to create new availability
          //create new availability entry
          const response = await axios.post(`${API_URL}/schedule`, item, {
            withCredentials: true,
            headers: { 'Content-Type': 'application/json' }
          });
          return response.data;
        } else if (item.action === "delete") {
          // DELETE by id or timestamp
          const itemById = await axios.get(`${API_URL}/schedule/${item.id}`, {
            withCredentials: true,
          });
          const response = await axios.delete(`${API_URL}/schedule/${item.id}`, {
            withCredentials: true,
          });
          return { ...item, deleted: true };
        } else if (item.action === "update") {
          item.action = "";
          // PUT or PATCH to update existing availability
          const response = await axios.put(`${API_URL}/schedule/${item.id}`, item, {
            withCredentials: true,
            headers: { 'Content-Type': 'application/json' }
          });
          return response.data;
        } else {
          // Unknown action, skip or throw error
          return null;
        }
      })
    );
    // Filter out nulls and deleted items if needed
    return results.filter(Boolean) as Availability;
  } catch (error) {
    console.error('Error saving schedule:', error);
    throw error;
  }
};