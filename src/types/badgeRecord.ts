export interface BadgeRecord {
  id?: string;
  user_id: string;
  badge_name: string;
  badge_description: string;
  badge_weight: number;
  patch?: string | null;
}