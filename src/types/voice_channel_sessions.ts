// filepath: /home/martinmedic/beowulfscheduler/src/types/hittracker.ts

export interface VoiceChannelSession {
  id: string;
  user_id: string;
  channel_id: string;
  channel_name: string;
  joined_at: string;
  left_at: string;
  minutes: number;
}