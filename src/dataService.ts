import { CheckerRecord, DashboardData } from "./types";

const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRWO323eX8EJcpNnIGh2aFxErDMor_tt7o0VkJI82T5oTxOJ2XxmYgUOG4qgg1WJ3Jlcv4ZqBcS91F4/pub?output=csv";

// Helper to format hours, minutes, seconds as HH.MM.SS
export function formatTimeWithDots(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(date.getHours())}.${pad(date.getMinutes())}.${pad(date.getSeconds())}`;
}

// Format date in Indonesian language in uppercase (e.g., SELASA, 30 JUNI 2026)
export function formatIndonesianDate(date: Date): string {
  const days = ["MINGGU", "SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"];
  const months = [
    "JANUARI",
    "FEBRUARI",
    "MARET",
    "APRIL",
    "MEI",
    "JUNI",
    "JULI",
    "AGUSTUS",
    "SEPTEMBER",
    "OKTOBER",
    "NOVEMBER",
    "DESEMBER",
  ];

  const dayName = days[date.getDay()];
  const dayOfMonth = date.getDate();
  const monthName = months[date.getMonth()];
  const year = date.getFullYear();

  return `${dayName}, ${dayOfMonth} ${monthName} ${year}`;
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const response = await fetch(SHEET_CSV_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch spreadsheet data: ${response.statusText}`);
  }
  
  const csvText = await response.text();
  return parseCsvToDashboardData(csvText);
}

export function parseCsvToDashboardData(csvText: string): DashboardData {
  const rows = csvText.split(/\r?\n/);
  
  const shift1: CheckerRecord[] = [];
  const shift2: CheckerRecord[] = [];
  const shift3: CheckerRecord[] = [];
  const monthly: CheckerRecord[] = [];

  // Skip header row at i=0
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i].trim();
    if (!row) continue;
    
    const cols = row.split(",");
    
    // Parse Shift 1 (cols 0-3)
    if (
      cols[0] &&
      cols[0].trim() !== "" &&
      cols[0].trim().toLowerCase() !== "grand total" &&
      cols[0].trim().toUpperCase() !== "NAMA"
    ) {
      shift1.push({
        nama: cols[0].trim().toUpperCase(),
        so: parseInt(cols[1]) || 0,
        sku: parseInt(cols[2]) || 0,
        qty: parseInt(cols[3]) || 0,
      });
    }

    // Parse Shift 2 (cols 5-8)
    if (
      cols[5] &&
      cols[5].trim() !== "" &&
      cols[5].trim().toLowerCase() !== "grand total" &&
      cols[5].trim().toUpperCase() !== "NAMA"
    ) {
      shift2.push({
        nama: cols[5].trim().toUpperCase(),
        so: parseInt(cols[6]) || 0,
        sku: parseInt(cols[7]) || 0,
        qty: parseInt(cols[8]) || 0,
      });
    }

    // Parse Shift 3 (cols 10-13)
    if (
      cols[10] &&
      cols[10].trim() !== "" &&
      cols[10].trim().toLowerCase() !== "grand total" &&
      cols[10].trim().toUpperCase() !== "NAMA"
    ) {
      shift3.push({
        nama: cols[10].trim().toUpperCase(),
        so: parseInt(cols[11]) || 0,
        sku: parseInt(cols[12]) || 0,
        qty: parseInt(cols[13]) || 0,
      });
    }

    // Parse Monthly (cols 15-18)
    if (
      cols[15] &&
      cols[15].trim() !== "" &&
      cols[15].trim().toLowerCase() !== "grand total" &&
      cols[15].trim().toUpperCase() !== "NAMA QC"
    ) {
      monthly.push({
        nama: cols[15].trim().toUpperCase(),
        so: parseInt(cols[16]) || 0,
        sku: parseInt(cols[17]) || 0,
        qty: parseInt(cols[18]) || 0,
      });
    }
  }

  // Sort daily lists by SKU descending
  shift1.sort((a, b) => b.sku - a.sku);
  shift2.sort((a, b) => b.sku - a.sku);
  shift3.sort((a, b) => b.sku - a.sku);
  
  // Sort monthly list by SKU descending
  monthly.sort((a, b) => b.sku - a.sku);

  // Calculate Monthly average SKU (for non-zero items or all items? Let's do all items, but filter out if needed.
  // Standard is all parsed monthly list items)
  const totalSku = monthly.reduce((sum, item) => sum + item.sku, 0);
  const averageSku = monthly.length > 0 ? totalSku / monthly.length : 0;

  return {
    shift1,
    shift2,
    shift3,
    monthly,
    lastUpdate: formatTimeWithDots(new Date()),
    averageSku: parseFloat(averageSku.toFixed(1)),
  };
}
