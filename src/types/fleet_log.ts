export interface FleetLog {
  id: number;
  created_at?: string; // ISO date string, nullable
  notes?: string;
  commander_id?: number;
  patch?: string;
  crew_usernames?: string[];
  air_sub_usernames?: string[];
  fps_sub_usernames?: string[];
  link?: string;
  title?: string;
  commander_username?: string;
  air_sub_ids?: number[];
  fps_sub_ids?: number[];
  crew_ids?: number[];
  start_time?: string; // ISO timestamp string, nullable
  end_time?: string;   // ISO timestamp string, nullable
  total_kills?: number;
  value_stolen?: number;
  damages_value?: number;
  fleet_id?: number;
  fleet_name?: string;
  video_link: string;
  media_links: string[];
}