import axios from 'axios';
import { FleetLog } from '../types/fleet_log';

const API_BASE_URL = `${import.meta.env.VITE_IS_LIVE === "true" ? import.meta.env.VITE_LIVE_API_URL : import.meta.env.VITE_TEST_API_URL}`;

// Fetch all ship logs
export const fetchAllShipLogs = async (): Promise<FleetLog[]> => {
  const response = await axios.get<FleetLog[]>(`${API_BASE_URL}/api/shiplog/`);
  return response.data;
};

// Fetch ship logs by commander user ID
export const fetchShipLogsByCommander = async (user_id: string): Promise<FleetLog[]> => {
  const response = await axios.get<FleetLog[]>(`${API_BASE_URL}/api/shiplog/commander`, {
    params: { user_id },
  });
  return response.data;
};

// Fetch ship logs by owner user ID
export const fetchShipLogsByOwner = async (user_id: string): Promise<FleetLog[]> => {
  const response = await axios.get<FleetLog[]>(`${API_BASE_URL}/api/shiplog/owner`, {
    params: { user_id },
  });
  return response.data;
};

// Fetch ship logs by entry ID
export const fetchShipLogsByEntryId = async (entry_id: string): Promise<FleetLog[]> => {
  const response = await axios.get<FleetLog[]>(`${API_BASE_URL}/api/shiplog/entry`, {
    params: { entry_id },
  });
  return response.data;
};

// Fetch ship logs by patch
export const fetchShipLogsByPatch = async (patch: string): Promise<FleetLog[]> => {
  const response = await axios.get<FleetLog[]>(`${API_BASE_URL}/api/shiplog/patch`, {
    params: { patch },
  });
  return response.data;
};

// Fetch ship logs by commander and patch
export const fetchShipLogsByCommanderAndPatch = async (user_id: string, patch: string): Promise<FleetLog[]> => {
  const response = await axios.get<FleetLog[]>(`${API_BASE_URL}/api/shiplog/commanderandpatch`, {
    params: { user_id, patch },
  });
  return response.data;
};

// Fetch crew entries
export const fetchCrewEntries = async (): Promise<FleetLog[]> => {
  const response = await axios.get<FleetLog[]>(`${API_BASE_URL}/api/shiplog/crew`);
  return response.data;
};

// Fetch crew entries by user and patch
export const fetchCrewEntriesUserPatch = async (user_id: string, patch: string): Promise<FleetLog[]> => {
  const response = await axios.get<FleetLog[]>(`${API_BASE_URL}/api/shiplog/crewuserpatch`, {
    params: { user_id, patch },
  });
  return response.data;
};

// Create a new ship log
export const createShipLog = async (fleetLog: FleetLog): Promise<FleetLog> => {
  const response = await axios.post<FleetLog>(`${API_BASE_URL}/api/shiplog/`, fleetLog);
  return response.data;
};

// Edit an existing ship log
export const editShipLog = async (id: string, fleetLog: FleetLog): Promise<FleetLog> => {
  const response = await axios.put<FleetLog>(
    `${API_BASE_URL}/api/shiplog/${id}`,
    fleetLog,
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
};

// Delete a ship log
export const deleteShipLog = async (id: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/api/shiplog/${id}`);
};

// Fetch ship logs by fleet active status
export const fetchShipLogsByFleetActiveStatus = async (): Promise<FleetLog[]> => {
  const response = await axios.get<FleetLog[]>(`${API_BASE_URL}/api/shiplog/by-fleet-active`);
  return response.data;
};

// Fetch ship logs with top kills
export const fetchShipLogsTopKills = async (): Promise<FleetLog[]> => {
  const response = await axios.get<FleetLog[]>(`${API_BASE_URL}/api/shiplog/top-kills`);
  return response.data;
};

// Fetch ship logs with top damages
export const fetchShipLogsTopDamages = async (): Promise<FleetLog[]> => {
  const response = await axios.get<FleetLog[]>(`${API_BASE_URL}/api/shiplog/top-damages`);
  return response.data;
};

// Fetch ship logs for a fleet within the last 3 months
export const fetchRecentShipLogsByFleet = async (fleet_id: string): Promise<FleetLog[]> => {
  const response = await axios.get<FleetLog[]>(`${API_BASE_URL}/api/shiplog/recent-by-fleet`, {
    params: { fleet_id },
  });
  return response.data;
};