/**
 * Represents a single schedule entry as stored in the database
 */
export interface ScheduleEntry {
  id: number;
  author_id?: string;
  type?: string;
  attendees: string[];
  author_username?: string;
  attendees_usernames: string[];
  timestamp: string; // ISO 8601 string with timezone
  action?: string;
  allowed_ranks?: number[];
  allowed_ranks_names?: string[];
  title?: string;
  description?: string;
  start_time?: string; // ISO 8601 string with timezone
  end_time?: string;   // ISO 8601 string with timezone
  channel?: number;
  appearance?: any; // JSON object
  repeat?: boolean;
  rsvp_options?: any; // JSON object
  fleet?: number[];
  patch?: string;
  active?: boolean;
  repeat_end_date?: string; // ISO 8601 string with timezone
  repeat_frequency?: string; // e.g., "daily", "weekly", "monthly"
  repeat_series?: number; // Number of occurrences
  event_members?: string[];
}

/**
 * Represents a collection of schedule entries forming a complete availability
 */
export type Availability = ScheduleEntry[];