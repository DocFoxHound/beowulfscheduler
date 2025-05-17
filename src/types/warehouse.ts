export interface WarehouseItem {
  id: string;
  user_id: string;
  commodity_name: string;
  total_scu: number;
  total_value: number;
  patch: string;
  location: string,
  for_org: boolean,
}