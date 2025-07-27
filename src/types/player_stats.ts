export interface PlayerStats {
  user_id: string;
  shipackills?: string;
  shippukills?: string;
  shipkills?: string;
  shipacdamages?: number;
  shippudamages?: number;
  shipdamages?: number;
  fpsackills?: string;
  fpspukills?: string;
  fpskills?: string;
  shipsbleaderboardrank?: number;
  piracyscustolen?: number;
  piracyvaluestolen?: number;
  piracyhits?: string;
  piracyhitspublished?: string;
  fleetleads?: string;
  fleetassists?: string;
  fleetparticipated?: string;
  fleetkills?: number;
  fleetscu?: number;
  fleetvalue?: number;
  fleetdamages?: number;
  corsair?: number;
  raider?: number;
  raptor?: number;
  rank_name?: string;
  ronin?: boolean;
  fleetcommander?: boolean;
  voicehours?: number;
  recentgatherings?: number;
  flighthours?: string;
  // Add more fields as necessary
}