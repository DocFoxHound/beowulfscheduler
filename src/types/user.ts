/**
 * Represents a single day's schedule entry with available hours
 */
export interface User {
  id: number;
  username: string;
  nickname: string;
  corsair_level: number;
  raptor_level: number;
  radier_level: number;
  rank: number;
  roles: string[];
}

/**
 * Represents a collection of schedule entries forming a complete availability
 */
