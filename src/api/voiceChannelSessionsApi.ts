import axios from 'axios';
import { VoiceChannelSession } from '../types/voice_channel_sessions';

const API_BASE_URL = `${import.meta.env.VITE_IS_LIVE === "true" ? import.meta.env.VITE_LIVE_API_URL : import.meta.env.VITE_TEST_API_URL}`;

export const fetchAllVoiceChannelSessions = async (): Promise<VoiceChannelSession[]> => {
  const response = await axios.get<VoiceChannelSession[]>(`${API_BASE_URL}/api/voicechannelsessions`);
  return response.data;
};

export const createVoiceChannelSession = async (VoiceChannelSession: VoiceChannelSession): Promise<VoiceChannelSession> => {
  const response = await axios.post<VoiceChannelSession>(`${API_BASE_URL}/api/voicechannelsessions/`, VoiceChannelSession);
  return response.data;
}

export const editVoiceChannelSession = async (id: string, item: VoiceChannelSession): Promise<VoiceChannelSession> => {
  const response = await axios.put<VoiceChannelSession>(
    `${API_BASE_URL}/api/voicechannelsessions/${id}`,
    item,
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
};

export const deleteVoiceChannelSession = async (id: any): Promise<VoiceChannelSession> => {
  const response = await axios.delete<VoiceChannelSession>(`${API_BASE_URL}/api/voicechannelsessions/${id}`);
  return response.data;
}

export const fetchVoiceChannelSessionsByUserAndTimeframe = async (
  userId: string,
  start: string,
  end: string
  ): Promise<VoiceChannelSession[]> => {
  const response = await axios.get<VoiceChannelSession[]>(
    `${API_BASE_URL}/api/voicechannelsessions/byusertimeframe`,
    {
      params: { user_id: userId, start, end }
    }
  );
  return response.data;
};

// Fetch all voice channel sessions within a timeframe
export const fetchVoiceChannelSessionsByTimeframe = async (
  start: string,
  end: string
): Promise<VoiceChannelSession[]> => {
  const response = await axios.get<VoiceChannelSession[]>(
    `${API_BASE_URL}/api/voicechannelsessions/timeframe`,
    {
      params: { start, end }
    }
  );
  return response.data;
};