import { VoiceChannelSession } from "../types/voice_channel_sessions";

const toTimestamp = (value?: string | number | Date | null): number | null => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  const time = date.getTime();
  return Number.isFinite(time) ? time : null;
};

export const getSessionMinutes = (session?: VoiceChannelSession | null): number => {
  if (!session) return 0;
  const numericMinutes = Number((session as any).minutes);
  if (Number.isFinite(numericMinutes) && numericMinutes >= 0) {
    return numericMinutes;
  }

  const startTs = toTimestamp(session.started_at || session.joined_at);
  const endTs = toTimestamp(session.ended_at || session.left_at);
  if (startTs != null && endTs != null && endTs > startTs) {
    const diffMinutes = (endTs - startTs) / 60000;
    return diffMinutes > 0 ? Math.round(diffMinutes) : 0;
  }

  return 0;
};

export const normalizeVoiceSessions = (
  sessions?: VoiceChannelSession[] | null
): VoiceChannelSession[] => {
  if (!Array.isArray(sessions)) return [];
  return sessions.map((session) => ({
    ...session,
    minutes: getSessionMinutes(session),
  }));
};
