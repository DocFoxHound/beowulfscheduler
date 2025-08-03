export interface BadgeAccoladeRecord {
  id?: string;
  fleet_id: string;
  badge_name: string;
  badge_description: string;
  badge_weight: number;
  patch?: string | null;
  badge_icon: string;
  badge_url: string;
}