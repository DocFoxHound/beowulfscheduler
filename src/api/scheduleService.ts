import axios from 'axios';
import { type Availability } from '../types/schedule';

const API_URL = 'http://localhost:3000';

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
  try {
    console.log(availability)
    const response = await axios.post(`${API_URL}/schedule`, availability, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error saving schedule:', error);
    throw error;
  }
};