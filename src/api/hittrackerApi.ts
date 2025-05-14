import axios from 'axios';
import { Hit, Statistics, WarehouseItem } from '../types/hittracker';

const API_BASE_URL = 'https://api.example.com/hittracker'; // Replace with your actual API base URL

export const fetchStatistics = async (): Promise<Statistics> => {
  const response = await axios.get<Statistics>(`${API_BASE_URL}/statistics`);
  return response.data;
};

export const fetchRecentPirateHits = async (): Promise<Hit[]> => {
  const response = await axios.get<Hit[]>(`${API_BASE_URL}/recent-pirate-hits`);
  return response.data;
};

export const fetchRecentOtherHits = async (): Promise<Hit[]> => {
  const response = await axios.get<Hit[]>(`${API_BASE_URL}/recent-other-hits`);
  return response.data;
};

export const fetchWarehouseItems = async (): Promise<WarehouseItem[]> => {
  const response = await axios.get<WarehouseItem[]>(`${API_BASE_URL}/warehouse-items`);
  return response.data;
};