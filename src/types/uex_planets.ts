/**
 * Represents a single schedule entry as stored in the database
 */
export interface UexPlanets {
  id: number;
  id_star_system: number;
  name: string;
  is_available: number;
}

/**
 * Represents a collection of schedule entries forming a complete availability
 */
export type Planets = UexPlanets[];