// Fetch all warehouse items (admin/global)
export const fetchAllWarehouseItems = async (): Promise<WarehouseItem[]> => {
  try {
    const response = await axios.get<WarehouseItem[]>(`${API_BASE_URL}/api/warehouse/`);
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      // No items found, return empty array
      return [];
    }
    throw error;
  }
};
import axios from 'axios';
import { WarehouseItem } from '../types/warehouse';

const API_BASE_URL = `${import.meta.env.VITE_IS_LIVE === "true" ? import.meta.env.VITE_LIVE_API_URL : import.meta.env.VITE_TEST_API_URL}`;


export const fetchWarehouseItems = async (user_id: string | null): Promise<WarehouseItem[]> => {
  try {
    const response = await axios.get<WarehouseItem[]>(`${API_BASE_URL}/api/warehouse/user`, {
      params: {
        user_id: user_id,
      },
    });
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      // No items found for user, return empty array
      return [];
    }
    throw error;
  }
};

export const editWarehouseItem = async (id: string, item: WarehouseItem): Promise<WarehouseItem> => {
  const response = await axios.put<WarehouseItem>(
    `${API_BASE_URL}/api/warehouse/${id}`,
    item,
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
};

export const deleteWarehouseItem = async (id: any): Promise<WarehouseItem> => {
  const response = await axios.delete<WarehouseItem>(`${API_BASE_URL}/api/warehouse/${id}`);
  return response.data;
}

export const addWarehouseItem = async (item: WarehouseItem): Promise<WarehouseItem> => {
  const response = await axios.post<WarehouseItem>(`${API_BASE_URL}/api/warehouse/`, item);
  return response.data;
}


export const fetchPublicOrgWarehouseItems = async (): Promise<WarehouseItem[]> => {
  try {
    const response = await axios.get<WarehouseItem[]>(`${API_BASE_URL}/api/warehouse/orgpublic`);
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      // No org items found, return empty array
      return [];
    }
    throw error;
  }
};


export const fetchPrivateOrgWarehouseItems = async (): Promise<WarehouseItem[]> => {
  try {
    const response = await axios.get<WarehouseItem[]>(`${API_BASE_URL}/api/warehouse/orgprivate`);
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      // No private org items found, return empty array
      return [];
    }
    throw error;
  }
};