export interface UserFleet {
  id: number;
  name?: string;
  commander_id?: string | null; // <-- Add null here
  members_ids?: string[];
  primary_mission?: string;
  secondary_mission?: string;
  total_kills?: number;
  patch_kills?: number;
  total_damages?: number;
  total_damages_patch?: number;
  total_events?: number;
  total_events_patch?: number;
  last_active?: string; // ISO timestamp string
  commander_corsair_rank?: number;
  total_cargo_stolen?: number;
  total_cargo_stolen_patch?: number;
  total_value_stolen?: number;
  total_value_stolen_patch?: number;
  active?: boolean;
  original_commander_id?: string;
  avatar: string;
  updated_at?: string;
}