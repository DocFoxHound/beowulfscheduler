export interface UserFleet {
  id: string;
  name: string;
  commander_id: string;
  commander_username: string;
  members_ids: string[];
  members_usernames: string[];
  primary_mission: string;
  secondary_mission: string;
  total_kills: number;
  patch_kills: number;
  total_damages: number;
  total_damages_patch: number;
  total_events: number;
  total_events_patch: number;
  last_active: string;
  commander_corsair_rank: number;
  allowed_total_members: number;
  total_cargo_stolen: number;
  total_cargo_stolen_patch: number;
  total_value_stolen: number;
  total_value_stolen_patch: number;
  active: boolean;
}