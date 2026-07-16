import { useEffect, useState } from "react";
import { Loader2, RefreshCw, AlertTriangle } from "lucide-react";
import { DashboardData } from "./types";
import { fetchDashboardData, formatTimeWithDots, formatIndonesianDate } from "./dataService";
import { CheckerCard } from "./components/CheckerCard";

// Helper function to calculate Monthly Baseline Target
// Baseline is 300 SKU per day, with 1 day off in a week (7 days)
function getMonthlyBaseline(date: Date) {
  const currentDay = date.getDate();
  const offDays = Math.floor(currentDay / 7);
  const workingDays = currentDay - offDays;
  const targetSku = workingDays * 300;
  return {
    currentDay,
    workingDays,
    targetSku,
  };
}

export default function App() {
  // Live ticking clock state
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  
  // Calculate dynamic monthly baseline based on current date
  const { currentDay, workingDays, targetSku } = getMonthlyBaseline(currentTime);
  
  // Dashboard data states
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Live ticking clock effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch dashboard data
  const loadData = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    
    try {
      const result = await fetchDashboardData();
      setData(result);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Gagal memuat data dashboard. Silakan periksa koneksi internet Anda.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial load and periodic refresh
  useEffect(() => {
    loadData();

    // Auto refresh data every 30 seconds
    const dataInterval = setInterval(() => {
      loadData(true);
    }, 30000);

    return () => clearInterval(dataInterval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 md:p-6 lg:p-8 flex flex-col justify-between">
      <div className="w-full mx-auto flex-1 flex flex-col">
        {/* Header Section */}
        <header id="dashboard-header" className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 pb-5 border-b border-slate-300">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-black uppercase">
                Productivity Checker 1
              </h1>
              {isRefreshing && (
                <Loader2 className="h-6 w-6 text-black animate-spin" />
              )}
            </div>
            
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-xs md:text-sm font-black text-black tracking-wide uppercase">
                Update: {data ? data.lastUpdate : "--.--.--"}
              </span>
              <button
                onClick={() => loadData(true)}
                disabled={isRefreshing || isLoading}
                className="p-1 rounded-md hover:bg-slate-200/80 active:scale-95 transition-all text-black disabled:opacity-50"
                title="Refresh Data"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin text-black" : ""}`} />
              </button>
            </div>
          </div>

          {/* Right Header: Clock and Date */}
          <div className="mt-4 md:mt-0 flex flex-col items-start md:items-end">
            <span className="text-4xl md:text-5xl lg:text-6xl font-black tracking-widest text-black font-mono select-none">
              {formatTimeWithDots(currentTime)}
            </span>
            <span className="text-xs md:text-sm lg:text-base font-black text-black tracking-wider uppercase mt-1">
              {formatIndonesianDate(currentTime)}
            </span>
          </div>
        </header>

        {/* Main Dashboard Cards Grid */}
        <main className="w-full">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="h-12 w-12 text-black animate-spin" />
              <p className="text-sm md:text-base font-black text-black animate-pulse uppercase tracking-wider">
                Menghubungkan ke Google Sheets...
              </p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-2 border-red-500 rounded-xl p-8 max-w-md mx-auto text-center flex flex-col items-center shadow-md">
              <AlertTriangle className="h-14 w-14 text-red-600 mb-3" />
              <h3 className="text-base font-black text-red-950 uppercase tracking-wide mb-1.5">
                Koneksi Data Gagal
              </h3>
              <p className="text-sm font-black text-red-800 leading-relaxed mb-6">
                {error}
              </p>
              <button
                onClick={() => loadData()}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white text-xs md:text-sm font-black rounded-lg transition-colors shadow-md uppercase tracking-wider"
              >
                Coba Lagi
              </button>
            </div>
          ) : data ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1: Shift 1 */}
              <CheckerCard
                title="Daily Checker 1 Shift 1"
                records={data.shift1}
                targetText="Target: ≥ 300 SKU"
                threshold={300}
              />

              {/* Card 2: Shift 2 */}
              <CheckerCard
                title="Daily Checker 1 Shift 2"
                records={data.shift2}
                targetText="Target: ≥ 300 SKU"
                threshold={300}
              />

              {/* Card 3: Shift 3 */}
              <CheckerCard
                title="Daily Checker 1 Shift 3"
                records={data.shift3}
                targetText="Target: ≥ 300 SKU"
                threshold={300}
              />

              {/* Card 4: Monthly */}
              <CheckerCard
                title="Monthly Checker 1"
                records={data.monthly}
                targetText={`Target: ≥ ${targetSku.toLocaleString("id-ID")} SKU (${currentDay} Hari)`}
                threshold={targetSku}
                isMonthly={true}
              />
            </div>
          ) : null}
        </main>
      </div>

      {/* Footer Branding */}
      <footer className="mt-8 pt-4 border-t border-slate-300 text-center">
        <p className="text-[11px] font-black text-black tracking-widest uppercase">
          Productivity Monitoring System • Checker 1
        </p>
      </footer>
    </div>
  );
}
