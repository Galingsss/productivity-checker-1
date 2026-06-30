export interface CheckerRecord {
  nama: string;
  so: number;
  sku: number;
  qty: number;
}

export interface DashboardData {
  shift1: CheckerRecord[];
  shift2: CheckerRecord[];
  shift3: CheckerRecord[];
  monthly: CheckerRecord[];
  lastUpdate: string;
  averageSku: number;
}
