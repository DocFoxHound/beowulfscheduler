/**
 * Represents a single day's schedule entry with available hours
 */
export interface ScheduleEntry {
  action: string; // e.g., "add", "remove"
  id: number;
  author_id: number;
  timestamp: string; // ISO 8601 string with timezone, e.g., "2024-05-10T14:00:00Z"
  type: string;
  attendees: number[];
  author_username: string;
  attendees_usernames: string[];
}

/**
 * Represents a collection of schedule entries forming a complete availability
 */
export type Availability = ScheduleEntry[];