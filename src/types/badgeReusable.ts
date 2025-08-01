export interface BadgeReusable {
  id?: string;
  badge_name: string;
  badge_description: string;
  badge_weight: bigint;
  prestige: boolean;
  prestige_name: string;
  prestige_level: number;
  subject: string;
  deleted: boolean;
  progression: boolean;
  progression_rank: string;
  trigger: JSON[];
  image_url: string;
  emoji_name: string;
}