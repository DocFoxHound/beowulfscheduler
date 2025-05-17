// filepath: /home/martinmedic/beowulfscheduler/src/types/hittracker.ts

export interface Hit {
  id: string;
  user_id: string;
  cargo: string;
  total_value: number;
  patch: string;
  total_cut_value: number;
  assists: string[];
  total_scu: number;
  air_or_ground: string;
  title: string;
  story: string;
  timestamp: string;
  username: string;
  assists_usernames: string[];
}