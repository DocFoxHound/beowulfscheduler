export interface OrgGoals {
  id?: string;
  goal_name: string;
  goal_description: string;
  goal_trigger: JSON[];
  patch: string;
  created_at: Date;
  deleted: boolean;
  completed_on: Date | null;
  start_date: Date;
  end_date: Date;
  priority: number;
  manual_percentage: number;
  manual_progress: boolean;
}