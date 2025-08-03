/**
 * Represents a single day's schedule entry with available hours
 */
export interface User {
  id: string;
  username: string;
  nickname: string;
  corsair_level: number;
  raptor_level: number;
  radier_level: number;
  rank: number;
  roles: string[];
  verification_code?: string;
}

/**
 * Represents a collection of schedule entries forming a complete availability
 */
