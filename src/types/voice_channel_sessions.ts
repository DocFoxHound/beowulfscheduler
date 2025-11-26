export interface VoiceChannelSession {
  id?: string;
  user_id?: string | number;
  userId?: string | number;
  user?: { id?: string | number } | null;
  discord_user_id?: string | number;
  discordUserId?: string | number;
  member_id?: string | number;
  memberId?: string | number;
  channel_id?: string | number;
  channel_name?: string;
  guild_id?: string;
  created_by?: string;
  created_by_name?: string;
  joined_at?: string;
  left_at?: string;
  started_at?: string;
  ended_at?: string;
  minutes?: number | string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
}