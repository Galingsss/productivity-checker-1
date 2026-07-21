import { useEffect, useState, FormEvent } from "react";
import { Loader2, RefreshCw, AlertTriangle, Settings, X, Lock, CheckCircle2, Save, LogOut } from "lucide-react";
import { DashboardData } from "./types";
import { fetchDashboardData, formatTimeWithDots, formatIndonesianDate } from "./dataService";
import { CheckerCard } from "./components/CheckerCard";

// Determine the Effective Date based on 07:00 AM shift boundary
export function getEffectiveDate(date: Date) {
  const effDate = new Date(date);
  if (date.getHours() < 7) {
    effDate.setDate(effDate.getDate() - 1);
  }
  const year = effDate.getFullYear();
  const month = String(effDate.getMonth() + 1).padStart(2, "0");
  const day = String(effDate.getDate()).padStart(2, "0");
  const dateString = `${year}-${month}-${day}`;
  return { date: effDate, dateString };
}

// Calculate Historical-Safe Monthly Target
export function getHistoricalMonthlyTarget(currentTime: Date, defaultBaseline: number, customBaselineMap: Record<string, number>) {
  const { date: effectiveDate, dateString: effectiveDateString } = getEffectiveDate(currentTime);
  const year = effectiveDate.getFullYear();
  const month = effectiveDate.getMonth(); // 0-indexed
  const currentDay = effectiveDate.getDate();

  let totalTarget = 0;
  let workingDays = 0;

  for (let d = 1; d <= currentDay; d++) {
    const loopDate = new Date(year, month, d);
    // Skip Sundays
    if (loopDate.getDay() === 0) {
      continue;
    }

    const yyyy = loopDate.getFullYear();
    const mm = String(loopDate.getMonth() + 1).padStart(2, "0");
    const dd = String(loopDate.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;

    const dayBaseline = customBaselineMap[dateStr] !== undefined ? customBaselineMap[dateStr] : defaultBaseline;
    totalTarget += dayBaseline;
    workingDays++;
  }

  return {
    currentDay,
    workingDays,
    targetSku: totalTarget,
    effectiveDateString,
  };
}

export default function App() {
  // Live ticking clock state
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Load settings from localStorage
  const [defaultBaseline, setDefaultBaseline] = useState<number>(() => {
    const stored = localStorage.getItem("baseline_default");
    return stored !== null ? parseInt(stored, 10) : 50; // Initial default: 50 poin
  });

  const [customBaselineMap, setCustomBaselineMap] = useState<Record<string, number>>(() => {
    const stored = localStorage.getItem("baseline_custom_map");
    try {
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [adminPin, setAdminPin] = useState<string>(() => {
    return localStorage.getItem("admin_pin") || "8899";
  });

  // Calculate dynamic monthly and daily targets
  const { currentDay, workingDays, targetSku, effectiveDateString } = getHistoricalMonthlyTarget(
    currentTime,
    defaultBaseline,
    customBaselineMap
  );

  const activeDailyBaseline = customBaselineMap[effectiveDateString] !== undefined
    ? customBaselineMap[effectiveDateString]
    : defaultBaseline;

  // Dashboard data states
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Admin modal states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPin, setLoginPin] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  // Settings form input states
  const [inputDefaultBaseline, setInputDefaultBaseline] = useState("");
  const [inputTodayCustom, setInputTodayCustom] = useState("");
  const [inputNewPin, setInputNewPin] = useState("");
  const [inputConfirmNewPin, setInputConfirmNewPin] = useState("");
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Open settings panel and load initial inputs
  const openSettings = () => {
    setInputDefaultBaseline(defaultBaseline.toString());
    const todayVal = customBaselineMap[effectiveDateString];
    setInputTodayCustom(todayVal !== undefined ? todayVal.toString() : "");
    setInputNewPin("");
    setInputConfirmNewPin("");
    setSaveSuccess(null);
    setSaveError(null);
    setLoginError(null);
    setIsSettingsOpen(true);
  };

  // Handle Admin login authentication
  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    if (loginEmail.trim().toLowerCase() !== "galang.erdiansyah@mhealth.tech") {
      setLoginError("Email tidak terdaftar.");
      return;
    }
    if (loginPin !== adminPin) {
      setLoginError("PIN Keamanan salah.");
      return;
    }
    setIsLoggedIn(true);
    setLoginError(null);
    
    // Populate form inputs
    setInputDefaultBaseline(defaultBaseline.toString());
    const todayVal = customBaselineMap[effectiveDateString];
    setInputTodayCustom(todayVal !== undefined ? todayVal.toString() : "");
  };

  // Handle saving baseline configurations and optional security PIN change
  const handleSaveSettings = (e: FormEvent) => {
    e.preventDefault();
    setSaveSuccess(null);
    setSaveError(null);

    const parsedDefault = parseInt(inputDefaultBaseline, 10);
    if (isNaN(parsedDefault) || parsedDefault <= 0) {
      setSaveError("Baseline Default harus berupa angka positif.");
      return;
    }

    // Parse the today's custom baseline. If empty, we remove it from the map.
    let updatedMap = { ...customBaselineMap };
    if (inputTodayCustom.trim() === "") {
      delete updatedMap[effectiveDateString];
    } else {
      const parsedToday = parseInt(inputTodayCustom, 10);
      if (isNaN(parsedToday) || parsedToday <= 0) {
        setSaveError("Baseline khusus hari ini harus berupa angka positif atau dikosongkan.");
        return;
      }
      updatedMap[effectiveDateString] = parsedToday;
    }

    // Check if user wants to change PIN
    let updatedPin = adminPin;
    if (inputNewPin || inputConfirmNewPin) {
      if (inputNewPin !== inputConfirmNewPin) {
        setSaveError("Konfirmasi PIN baru tidak cocok.");
        return;
      }
      if (inputNewPin.length < 4) {
        setSaveError("PIN baru minimal harus 4 karakter.");
        return;
      }
      updatedPin = inputNewPin;
    }

    // Save to states and localStorage
    setDefaultBaseline(parsedDefault);
    localStorage.setItem("baseline_default", parsedDefault.toString());

    setCustomBaselineMap(updatedMap);
    localStorage.setItem("baseline_custom_map", JSON.stringify(updatedMap));

    if (updatedPin !== adminPin) {
      setAdminPin(updatedPin);
      localStorage.setItem("admin_pin", updatedPin);
    }

    setSaveSuccess("Pengaturan berhasil disimpan secara persisten!");
    setInputNewPin("");
    setInputConfirmNewPin("");
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setSaveSuccess(null);
    }, 3000);
  };

  // Handle admin logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    setLoginEmail("");
    setLoginPin("");
    setLoginError(null);
  };

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
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-2.5 md:p-4 lg:p-5 flex flex-col justify-between">
      <div className="w-full mx-auto flex-1 flex flex-col">
        {/* Header Section */}
        <header id="dashboard-header" className="flex flex-col md:flex-row md:items-center md:justify-between mb-5 pb-3 border-b border-slate-300">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl lg:text-3xl font-black tracking-tight text-black uppercase">
                Productivity Checker 1
              </h1>
              {isRefreshing && (
                <Loader2 className="h-5 w-5 text-black animate-spin" />
              )}
            </div>
            
            <div className="flex items-center gap-2.5 mt-1">
              <span className="text-xs md:text-xs font-black text-black tracking-wide uppercase">
                Update: {data ? data.lastUpdate : "--.--.--"}
              </span>
              <button
                onClick={() => loadData(true)}
                disabled={isRefreshing || isLoading}
                className="p-0.5 rounded-md hover:bg-slate-200/80 active:scale-95 transition-all text-black disabled:opacity-50"
                title="Refresh Data"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-black" : ""}`} />
              </button>

              {/* Settings Access Button */}
              <button
                onClick={openSettings}
                className="p-0.5 ml-1 rounded-md hover:bg-slate-200/80 active:scale-95 transition-all text-black"
                title="Pengaturan Target Baseline"
              >
                <Settings className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Right Header: Clock and Date */}
          <div className="mt-2 md:mt-0 flex flex-col items-start md:items-end">
            <span className="text-3xl md:text-4xl lg:text-5xl font-black tracking-widest text-black font-mono select-none">
              {formatTimeWithDots(currentTime)}
            </span>
            <span className="text-xs lg:text-sm font-black text-black tracking-wider uppercase mt-0.5">
              {formatIndonesianDate(currentTime)}
            </span>
          </div>
        </header>

        {/* Main Dashboard Cards Grid */}
        <main className="w-full">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-10 w-10 text-black animate-spin" />
              <p className="text-sm font-black text-black animate-pulse uppercase tracking-wider">
                Menghubungkan ke Google Sheets...
              </p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-2 border-red-500 rounded-xl p-8 max-w-md mx-auto text-center flex flex-col items-center shadow-md">
              <AlertTriangle className="h-12 w-12 text-red-600 mb-3" />
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
              {/* Card 1: Shift 1 */}
              <CheckerCard
                title="Daily Checker 1 Shift 1"
                records={data.shift1}
                targetText={`Target: ≥ ${activeDailyBaseline} SKU`}
                threshold={activeDailyBaseline}
              />

              {/* Card 2: Shift 2 */}
              <CheckerCard
                title="Daily Checker 1 Shift 2"
                records={data.shift2}
                targetText={`Target: ≥ ${activeDailyBaseline} SKU`}
                threshold={activeDailyBaseline}
              />

              {/* Card 3: Shift 3 */}
              <CheckerCard
                title="Daily Checker 1 Shift 3"
                records={data.shift3}
                targetText={`Target: ≥ ${activeDailyBaseline} SKU`}
                threshold={activeDailyBaseline}
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
      <footer className="mt-5 pt-3 border-t border-slate-300 text-center">
        <p className="text-[11px] font-black text-black tracking-widest uppercase">
          Productivity Monitoring System • Checker 1
        </p>
      </footer>

      {/* Settings Modal Pop-up */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-slate-300 w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 border-b-2 border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-base md:text-lg font-black text-black tracking-wide uppercase flex items-center gap-2">
                <Settings className="h-5 w-5 text-black animate-spin" />
                SMART BASELINE SETTINGS
              </h2>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-1 rounded-md hover:bg-slate-200 text-black transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1">
              {!isLoggedIn ? (
                /* Login Form */
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="text-center mb-4">
                    <Lock className="h-8 w-8 text-black mx-auto mb-2" />
                    <p className="text-xs font-black text-black uppercase tracking-wider">
                      Otentikasi Admin Terbatas
                    </p>
                  </div>

                  {loginError && (
                    <div className="p-2.5 bg-red-100 border-2 border-red-500 rounded-lg text-xs font-black text-red-950 uppercase text-center">
                      {loginError}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="block text-xs font-black text-black uppercase tracking-wider">
                      EMAIL ADMIN
                    </label>
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="contoh@mhealth.tech"
                      className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg text-sm font-black text-black focus:border-black focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-black text-black uppercase tracking-wider">
                      PIN KEAMANAN
                    </label>
                    <input
                      type="password"
                      required
                      value={loginPin}
                      onChange={(e) => setLoginPin(e.target.value)}
                      placeholder="••••"
                      className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg text-sm font-black text-black focus:border-black focus:outline-hidden text-center tracking-widest"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-black hover:bg-slate-900 text-white font-black text-xs md:text-sm rounded-lg transition-all tracking-widest uppercase shadow-md active:scale-98"
                  >
                    MASUK ADMIN
                  </button>
                </form>
              ) : (
                /* Settings Panel Form */
                <form onSubmit={handleSaveSettings} className="space-y-5">
                  {saveSuccess && (
                    <div className="p-3 bg-green-100 border-2 border-green-500 rounded-lg text-xs font-black text-black uppercase flex items-center justify-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                      {saveSuccess}
                    </div>
                  )}

                  {saveError && (
                    <div className="p-2.5 bg-red-100 border-2 border-red-500 rounded-lg text-xs font-black text-red-950 uppercase text-center">
                      {saveError}
                    </div>
                  )}

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
                    <p className="text-[10px] font-black text-blue-900 tracking-wider uppercase">
                      TANGGAL EFEKTIF SAAT INI
                    </p>
                    <p className="text-sm font-black text-black uppercase">
                      {effectiveDateString} (SHIFT BOUNDARY 07:00 PAGI)
                    </p>
                  </div>

                  {/* Section 1: Baseline Targets */}
                  <div className="space-y-3 pt-1 border-t-2 border-dashed border-slate-200">
                    <h3 className="text-xs font-black text-black uppercase tracking-widest">
                      1. TARGET BASELINE SKU
                    </h3>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-black text-black uppercase tracking-wider">
                        BASELINE DEFAULT (SKU/HARI)
                      </label>
                      <input
                        type="number"
                        required
                        value={inputDefaultBaseline}
                        onChange={(e) => setInputDefaultBaseline(e.target.value)}
                        placeholder="50"
                        className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg text-sm font-black text-black focus:border-black focus:outline-hidden"
                      />
                      <p className="text-[10px] font-bold text-slate-500 uppercase leading-normal">
                        Diterapkan otomatis jika tidak ada baseline kustom harian.
                      </p>
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <label className="block text-xs font-black text-black uppercase tracking-wider">
                        BASELINE KHUSUS HARI INI
                      </label>
                      <input
                        type="number"
                        value={inputTodayCustom}
                        onChange={(e) => setInputTodayCustom(e.target.value)}
                        placeholder="Gunakan Baseline Default"
                        className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg text-sm font-black text-black focus:border-black focus:outline-hidden bg-amber-50/40"
                      />
                      <p className="text-[10px] font-bold text-slate-500 uppercase leading-normal">
                        Hanya berlaku hari ini ({effectiveDateString}). Kosongkan untuk kembali ke Baseline Default besok jam 07:00 pagi.
                      </p>
                    </div>
                  </div>

                  {/* Section 2: Security Change */}
                  <div className="space-y-3 pt-4 border-t-2 border-dashed border-slate-200">
                    <h3 className="text-xs font-black text-black uppercase tracking-widest">
                      2. PIN KEAMANAN BARU
                    </h3>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-black text-black uppercase tracking-wider">
                          PIN BARU
                        </label>
                        <input
                          type="password"
                          value={inputNewPin}
                          onChange={(e) => setInputNewPin(e.target.value)}
                          placeholder="••••"
                          maxLength={8}
                          className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg text-sm font-black text-black focus:border-black focus:outline-hidden text-center tracking-widest"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-black text-black uppercase tracking-wider">
                          KONFIRMASI PIN
                        </label>
                        <input
                          type="password"
                          value={inputConfirmNewPin}
                          onChange={(e) => setInputConfirmNewPin(e.target.value)}
                          placeholder="••••"
                          maxLength={8}
                          className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg text-sm font-black text-black focus:border-black focus:outline-hidden text-center tracking-widest"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase leading-normal">
                      Kosongkan kedua kolom jika tidak ingin mengubah PIN keamanan.
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-3 border-t-2 border-slate-200">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="px-3 py-2 border-2 border-black hover:bg-slate-100 rounded-lg font-black text-xs text-black tracking-wider uppercase flex items-center justify-center gap-1.5"
                    >
                      <LogOut className="h-4 w-4 text-black" />
                      KELUAR
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 bg-black hover:bg-slate-900 text-white font-black text-xs md:text-sm rounded-lg transition-all tracking-widest uppercase flex items-center justify-center gap-2 shadow-md active:scale-98"
                    >
                      <Save className="h-4 w-4" />
                      SIMPAN
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
