// filepath: /home/martinmedic/beowulfscheduler/src/types/hittracker.ts

export interface PlayerExperience {
  id: string;
  user_id: string;
  username: string;
  operation_id: string;
  operation_name: string;
  operation_type: string;
  patch: string;
  dogfighter: boolean;
  marine: boolean;
  snare: boolean;
  cargo: boolean;
  multicrew: boolean;
  salvage: boolean;
  air_leadership: boolean;
  ground_leadership: boolean;
  commander: boolean;
  type_of_experience: string; // example: "fleet", "piracy", "practice"
}