export interface FleetLog {
  id: string;
  created_at?: string; // ISO date string, nullable
  notes?: string;
  commander_id?: string;
  patch?: string;
  crew_usernames?: string[];
  air_sub_usernames?: string[];
  fps_sub_usernames?: string[];
  link?: string;
  title?: string;
  commander_username?: string;
  air_sub_ids?: string[];
  fps_sub_ids?: string[];
  crew_ids?: string[];
  start_time?: string; // ISO timestamp string, nullable
  end_time?: string;   // ISO timestamp string, nullable
  total_kills?: number;
  value_stolen?: number;
  damages_value?: number;
  total_cargo?: number;
  fleet_id?: string;
  fleet_name?: string;
  video_link: string;
  media_links: string[];
  associated_hits: string[];
}