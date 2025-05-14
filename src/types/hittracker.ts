// filepath: /home/martinmedic/beowulfscheduler/src/types/hittracker.ts

export interface Hit {
  id: string;
  playerId: string;
  targetId: string;
  timestamp: Date;
  value: number;
}

export interface WarehouseItem {
  id: string;
  name: string;
  quantity: number;
  addedAt: Date;
}

export interface Statistics {
  totalHits: number;
  hitsCurrentPatch: number;
  totalItemsStolen: number;
  totalValue: number;
}