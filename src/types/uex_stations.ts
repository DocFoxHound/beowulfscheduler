/**
 * Represents a single schedule entry as stored in the database
 */
export interface UexStations {
  id: number;
  id_star_system: number;
  id_planet: number;
  name: string;
  nickname: string;
  is_available: number;
}

/**
 * Represents a collection of schedule entries forming a complete availability
 */
export type Stations = UexStations[];