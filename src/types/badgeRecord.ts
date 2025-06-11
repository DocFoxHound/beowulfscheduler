export interface BadgeRecord {
  id: bigint;
  user_id: bigint;
  badge_name: string;
  badge_description: string;
  badge_weight: bigint;
  patch?: string | null;
}