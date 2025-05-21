// filepath: /home/martinmedic/beowulfscheduler/src/types.ts
type CargoItem = {
  commodity_name: string;
  scuAmount: number;
  avg_price: number;
};

export interface Hit {
  id: string;
  user_id: string;
  cargo: CargoItem[];
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
  video_link: string;
  additional_media_links: string[];
  type_of_piracy: string;
  fleet_activity: boolean;
  fleet_names: string[];
  fleet_ids: string[];
}