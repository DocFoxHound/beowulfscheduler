// filepath: /home/martinmedic/beowulfscheduler/src/types/hittracker.ts

export interface RecentGang {
  id: string;
  channel_id: string;
  channel_name: string;
  timestamp: string;
  created_at: string;
  users: JSON[];
  pu_shipkills: number;
  pu_fpskills: number;
  ac_shipkills: number;
  ac_fpskills: number;
  stolen_cargo: number;
  stolen_value: number;
  damages: number;
  patch: string;
  icon_url: string;
  accolade: string;
}