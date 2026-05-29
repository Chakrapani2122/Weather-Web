import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, isFirebaseLive, signInWithGoogle, handleSignOut } from "./firebase";
import {
  WeatherDataPayload,
  UserDashboardPreferences,
  CustomizableGridConfig,
  DiagnosticLog,
  UnitSystem,
} from "./types";
import AuthBar from "./components/AuthBar";
import CitySearch from "./components/CitySearch";
import ThemeToggle from "./components/ThemeToggle";
import HourlyForecastSlider from "./components/HourlyForecastSlider";
import DailyForecastList, { getWeatherIcon } from "./components/DailyForecastList";
import HistoricalCharts from "./components/HistoricalCharts";
import DiagnosticCenter from "./components/DiagnosticCenter";
import {
  Sparkles,
  RefreshCw,
  Sliders,
  MapPin,
  Trash2,
  ChevronDown,
  Layout,
  ChevronUp,
  ShieldAlert,
  Wind,
  Compass,
  Droplets,
  Gauge,
  Sun,
  Sunset,
  Volume2,
  Bookmark,
  BrainCircuit,
} from "lucide-react";

const INITIAL_CITY = "Singapore";

const DEFAULT_GRID_CONFIG: CustomizableGridConfig = {
  hourlyForecast: true,
  dailyForecast: true,
  historicalCharts: true,
  humidityPressure: true,
  windSystem: true,
  sunAndUv: true,
  aiBriefing: true,
  realTimeAlerts: true,
};

const DEFAULT_WIDGET_ORDER = [
  "realTimeAlerts",
  "aiBriefing",
  "hourlyForecast",
  "windSystem",
  "humidityPressure",
  "sunAndUv",
  "dailyForecast",
  "historicalCharts",
];

const DEFAULT_PREFERENCES: UserDashboardPreferences = {
  uid: "local-user",
  email: "local@example.com",
  displayName: "GUEST User",
  photoURL: null,
  savedCities: ["Singapore", "Mumbai", "London", "Cairo"],
  unitSystem: "metric",
  gridConfig: DEFAULT_GRID_CONFIG,
  widgetOrder: DEFAULT_WIDGET_ORDER,
  updatedAt: Date.now(),
};

export default function App() {
  const [activeCity, setActiveCity] = useState(INITIAL_CITY);
  const [weather, setWeather] = useState<WeatherDataPayload | null>(null);
  
  // High fidelity state containing payloads of cached cities to empower multi-station severe warnings & historical comparisons
  const [savedCitiesData, setSavedCitiesData] = useState<Record<string, WeatherDataPayload>>({});
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  
  // HTML5 Ambient Server Warnings settings
  const [enableBrowserPush, setEnableBrowserPush] = useState<boolean>(() => {
    return localStorage.getItem("aether-push-enabled") === "true";
  });
  
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem("aether-dismissed-alerts");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // App Synchronization & Identity states
  const [authReady, setAuthReady] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserDashboardPreferences | null>(null);
  const [syncPolicy, setSyncPolicy] = useState<"cloud-first" | "local-first" | "merge">("merge");
  const [syncStatus, setSyncStatus] = useState<"synced" | "local-only" | "conflict" | "syncing" | "error">("local-only");
  const [logs, setLogs] = useState<DiagnosticLog[]>([]);

  // Logger helper
  const addLog = useCallback((category: DiagnosticLog["category"], message: string, severity: DiagnosticLog["severity"] = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    const newLog: DiagnosticLog = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp,
      category,
      message,
      severity,
    };
    setLogs((prev) => [newLog, ...prev].slice(0, 50)); // Keep last 50 logs
  }, []);

  // Theme support
  useEffect(() => {
    const localTheme = localStorage.getItem("aether-theme");
    if (localTheme) {
      const isDark = localTheme === "dark";
      setDarkMode(isDark);
      document.documentElement.classList.toggle("dark", isDark);
    } else {
      document.documentElement.classList.add("dark");
    }
  }, []);

  const handleThemeToggle = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    localStorage.setItem("aether-theme", nextDark ? "dark" : "light");
    document.documentElement.classList.toggle("dark", nextDark);
    addLog("ui", `Theme toggled to ${nextDark ? "dark" : "light"}`);
  };

  // Fetch core weather for a specific city
  const fetchWeather = useCallback(async (city: string) => {
    setIsSearching(true);
    addLog("network", `Initiating server-side weather request for city: "${city}"`);
    try {
      const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
      if (!response.ok) {
        throw new Error(`Meteorological API responded with status code ${response.status}`);
      }
      const data: WeatherDataPayload = await response.json();
      setWeather(data);
      setActiveCity(data.city); // Align spelling/formatting returned by server
      
      // Update our central caches
      setSavedCitiesData((prev) => ({
        ...prev,
        [data.city.toLowerCase()]: data,
      }));

      addLog("weather-gen", `Successfully retrieved weather profile for ${data.city}, ${data.country}. [Coords: ${data.lat}°N, ${data.lon}°E]`);
    } catch (err: any) {
      addLog("weather-gen", `General weather fetching failure: ${err.message}`, "error");
    } finally {
      setIsSearching(false);
      setIsLoading(false);
    }
  }, [addLog]);

  // Trigger weather on mount
  useEffect(() => {
    fetchWeather(activeCity);
  }, [fetchWeather, activeCity]);

  // Load offline preferences on boot
  useEffect(() => {
    const savedPrefs = localStorage.getItem("aether-prefs");
    if (savedPrefs) {
      try {
        const parsed = JSON.parse(savedPrefs) as UserDashboardPreferences;
        setCurrentUser(parsed);
        setSyncStatus(isFirebaseLive ? "local-only" : "local-only");
        addLog("ui", "Successfully retrieved cached preferences offline.", "info");
      } catch (e) {
        addLog("ui", "Error parsing cached parameters; reverting to defaults.", "warning");
        setCurrentUser(DEFAULT_PREFERENCES);
      }
    } else {
      setCurrentUser(DEFAULT_PREFERENCES);
      addLog("ui", "No pre-existing local dashboard parameters. Set defaults.", "info");
    }
  }, [addLog]);

  // Sync state upward to Firestore or offline LocalStorage
  const persistPreferencesAndSync = async (nextPrefs: UserDashboardPreferences) => {
    localStorage.setItem("aether-prefs", JSON.stringify(nextPrefs));
    setCurrentUser(nextPrefs);

    if (!isFirebaseLive || !auth?.currentUser || !db) {
      setSyncStatus("local-only");
      return;
    }

    setSyncStatus("syncing");
    addLog("firebase", "Uploading local parameters to Firestore Weather Cloud", "info");
    try {
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      await setDoc(userDocRef, {
        uid: nextPrefs.uid,
        email: nextPrefs.email,
        displayName: nextPrefs.displayName,
        photoURL: nextPrefs.photoURL,
        savedCities: nextPrefs.savedCities,
        unitSystem: nextPrefs.unitSystem,
        gridConfig: nextPrefs.gridConfig,
        widgetOrder: nextPrefs.widgetOrder || DEFAULT_WIDGET_ORDER,
        updatedAt: Date.now(),
      });
      setSyncStatus("synced");
      addLog("firebase", "Firestore cloud upload complete. Synchronization verified.", "info");
    } catch (err: any) {
      setSyncStatus("error");
      addLog("firebase", `Firestore push failure: ${err.message}`, "error");
    }
  };

  // Google Authentication Listener and Conflict Resolver
  useEffect(() => {
    if (!isFirebaseLive || !auth) {
      setAuthReady(true);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setAuthReady(true);
      if (firebaseUser) {
        addLog("firebase", `Active Google user session detected: [${firebaseUser.email}]`, "info");
        setSyncStatus("syncing");
        
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const docSnap = await getDoc(userDocRef);
          
          const localPrefsRaw = localStorage.getItem("aether-prefs");
          const localPrefs: UserDashboardPreferences = localPrefsRaw 
            ? JSON.parse(localPrefsRaw) 
            : DEFAULT_PREFERENCES;

          if (docSnap.exists()) {
            const cloudPrefs = docSnap.data() as UserDashboardPreferences;
            addLog("firebase", "Existing cloud parameters successfully fetched. Running integrity checks.", "info");

            // Evaluate conflict: Do local bookmarks differ from cloud?
            const cloudCities = cloudPrefs.savedCities.map(c => c.toLowerCase());
            const localCities = localPrefs.savedCities.map(c => c.toLowerCase());
            const listsMatch = 
              cloudCities.length === localCities.length && 
              cloudCities.every(c => localCities.includes(c));

            if (listsMatch) {
              persistPreferencesAndSync(cloudPrefs);
              setSyncStatus("synced");
            } else {
              setSyncStatus("conflict");
              addLog("firebase", `Conflict resolved using configured policy: "${syncPolicy}"`, "warning");
              
              if (syncPolicy === "cloud-first") {
                persistPreferencesAndSync(cloudPrefs);
                addLog("firebase", "Cloud preferences loaded over local data.", "info");
              } else if (syncPolicy === "local-first") {
                const updatedLocal = {
                  ...localPrefs,
                  uid: firebaseUser.uid,
                  email: firebaseUser.email || "",
                  displayName: firebaseUser.displayName,
                  photoURL: firebaseUser.photoURL,
                };
                persistPreferencesAndSync(updatedLocal);
                addLog("firebase", "Local unauthenticated settings pushed upward to Cloud.", "info");
              } else {
                const combinedCities = Array.from(new Set([...cloudPrefs.savedCities, ...localPrefs.savedCities]));
                const mergedPrefs: UserDashboardPreferences = {
                  ...cloudPrefs,
                  savedCities: combinedCities,
                  uid: firebaseUser.uid,
                  email: firebaseUser.email || "",
                  displayName: firebaseUser.displayName,
                  photoURL: firebaseUser.photoURL,
                  updatedAt: Date.now(),
                };
                persistPreferencesAndSync(mergedPrefs);
                addLog("firebase", `Merged city records. Combined lists total ${combinedCities.length} dashboards`, "info");
              }
            }
          } else {
            addLog("firebase", "Creating baseline Firestore cloud profile.", "info");
            const newCloudPrefs: UserDashboardPreferences = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              savedCities: localPrefs.savedCities,
              unitSystem: localPrefs.unitSystem,
              gridConfig: localPrefs.gridConfig,
              widgetOrder: localPrefs.widgetOrder || DEFAULT_WIDGET_ORDER,
              updatedAt: Date.now(),
            };
            persistPreferencesAndSync(newCloudPrefs);
          }
        } catch (e: any) {
          addLog("firebase", `Sync handshake failed: ${e.message}`, "error");
          setSyncStatus("error");
        }
      } else {
        addLog("firebase", "Google Session cleared. Reverting to local storage sandbox.", "info");
        const localPrefsRaw = localStorage.getItem("aether-prefs");
        if (localPrefsRaw) {
          const localPrefs = JSON.parse(localPrefsRaw) as UserDashboardPreferences;
          setCurrentUser({
            ...localPrefs,
            uid: "local-user",
            displayName: "Guest User",
            photoURL: null,
          });
        }
        setSyncStatus("local-only");
      }
    });

    return () => unsubscribe();
  }, [syncPolicy, addLog]);

  // Perform parallel background queries for saved bookmarks on start to populate cached values
  useEffect(() => {
    if (!currentUser || currentUser.savedCities.length === 0) return;
    
    currentUser.savedCities.forEach(async (city) => {
      const cacheKey = city.toLowerCase();
      if (savedCitiesData[cacheKey]) return; // Already cached
      
      try {
        const res = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
        if (res.ok) {
          const data: WeatherDataPayload = await res.json();
          setSavedCitiesData((prev) => ({
            ...prev,
            [cacheKey]: data,
          }));
        }
      } catch (err) {
        // Tolerated background fetches
      }
    });
  }, [currentUser, savedCitiesData]);

  // Auth controls
  const handleAuthSignIn = async () => {
    addLog("firebase", "Triggering popup authentication dialog...");
    try {
      await signInWithGoogle();
    } catch (err: any) {
      addLog("firebase", `Sign in incomplete: ${err.message}`, "error");
    }
  };

  const handleAuthSignOut = async () => {
    addLog("firebase", "Logging out active user session...");
    try {
      await handleSignOut();
    } catch (e: any) {
      addLog("firebase", `Sign out failed: ${e.message}`, "error");
    }
  };

  // Saved bookmark actions
  const handleToggleSaveCity = (city: string) => {
    if (!currentUser) return;
    const clean = city.trim();
    const cityList = [...currentUser.savedCities];
    const matchIdx = cityList.findIndex((c) => c.toLowerCase() === clean.toLowerCase());

    if (matchIdx >= 0) {
      cityList.splice(matchIdx, 1);
      addLog("ui", `Removed "${clean}" from dashboard bookmarks.`);
    } else {
      cityList.push(clean);
      addLog("ui", `Added "${clean}" to dashboard bookmarks.`);
    }

    persistPreferencesAndSync({
      ...currentUser,
      savedCities: cityList,
    });
  };

  const handleRemoveCityDirectly = (city: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid loading the city
    if (!currentUser) return;
    const updated = currentUser.savedCities.filter((c) => c.toLowerCase() !== city.toLowerCase());
    persistPreferencesAndSync({
      ...currentUser,
      savedCities: updated,
    });
    addLog("ui", `Removed dashboard card bookmark: ${city}`);
  };

  // Configuration changes
  const handleUnitToggle = (unit: UnitSystem) => {
    if (!currentUser) return;
    persistPreferencesAndSync({
      ...currentUser,
      unitSystem: unit,
    });
    addLog("ui", `Meteorological system metrics set to: ${unit.toUpperCase()}`);
  };

  const handleGridConfigToggle = (key: keyof CustomizableGridConfig) => {
    if (!currentUser) return;
    const updatedConfig = {
      ...currentUser.gridConfig,
      [key]: !currentUser.gridConfig[key],
    };
    persistPreferencesAndSync({
      ...currentUser,
      gridConfig: updatedConfig,
    });
    addLog("ui", `Custom dashboard card status updated for: "${key}"`);
  };

  // Swapping widget order rankings manually (Up/Down triggers)
  const handleSwapWidgetOrder = (indexA: number, indexB: number) => {
    if (!currentUser) return;
    const activeOrder = currentUser.widgetOrder || DEFAULT_WIDGET_ORDER;
    const nextOrder = [...activeOrder];
    // Swap
    const temp = nextOrder[indexA];
    nextOrder[indexA] = nextOrder[indexB];
    nextOrder[indexB] = temp;

    persistPreferencesAndSync({
      ...currentUser,
      widgetOrder: nextOrder,
    });
    addLog("ui", "Updated custom dashboard widgets ordering layout.");
  };

  // HTML5 push messages request
  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      addLog("ui", `System push notifications authorization status: "${permission}"`);
      return permission;
    }
    return "unsupported";
  };

  // Silencing local alerts
  const handleDismissAlert = (id: string) => {
    const next = [...dismissedAlerts, id];
    setDismissedAlerts(next);
    localStorage.setItem("aether-dismissed-alerts", JSON.stringify(next));
    addLog("ui", "Dismissed system severe climate advisory warning.");
  };

  // Evaluate severe alerts across all saved locations
  const activeSevereAlerts = useMemo(() => {
    if (!currentUser) return [];
    const list: any[] = [];

    currentUser.savedCities.forEach((city) => {
      const cacheKey = city.toLowerCase();
      const payload = savedCitiesData[cacheKey];
      if (!payload) return;

      // 1. Severe heatwaves checking (>33 Celsius)
      if (payload.current.temp > 33) {
        const id = `heat-${cacheKey}`;
        if (!dismissedAlerts.includes(id)) {
          list.push({
            id,
            city: payload.city,
            title: "Severe Heatwave advisory threshold exceeded",
            description: `Air temperatures have soared to ${Math.round(payload.current.temp)}°C in ${payload.city}. Ensure adequate hydration index.`,
          });
        }
      }

      // 2. Gale force wind velocities (>11 m/s)
      if (payload.current.windSpeed > 11) {
        const id = `wind-${cacheKey}`;
        if (!dismissedAlerts.includes(id)) {
          list.push({
            id,
            city: payload.city,
            title: "Dangerous Wind Velocity Gales",
            description: `Wind gusts are measured at ${payload.current.windSpeed} m/s in ${payload.city}. Secure any floatable patio products.`,
          });
        }
      }

      // 3. Snow / thunderstorms heavy precipitation warnings
      if (payload.current.condition === "Storm" || payload.current.condition === "Snow") {
        const id = `precip-${cacheKey}`;
        if (!dismissedAlerts.includes(id)) {
          list.push({
            id,
            city: payload.city,
            title: `Severe ${payload.current.condition} storm activity spotted`,
            description: `Convective weather systems are registering high precipitation in ${payload.city}. Limit redundant outdoor operations.`,
          });
        }
      }

      // 4. Incorporate payload alert objects from the server API
      if (payload.alerts && payload.alerts.length > 0) {
        payload.alerts.forEach((apiAlert) => {
          const id = `${apiAlert.id}-${cacheKey}`;
          if (!dismissedAlerts.includes(id)) {
            list.push({
              id,
              city: payload.city,
              title: apiAlert.title,
              description: apiAlert.description,
            });
          }
        });
      }
    });

    return list;
  }, [currentUser, savedCitiesData, dismissedAlerts]);

  // Backdoor trigger desktop notifications
  const notifiedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!enableBrowserPush || !("Notification" in window) || Notification.permission !== "granted") return;

    activeSevereAlerts.forEach((alert) => {
      if (!notifiedRef.current.has(alert.id)) {
        try {
          new Notification(`Aether Severe Warning: ${alert.city}`, {
            body: `${alert.title} — ${alert.description}`,
          });
          notifiedRef.current.add(alert.id);
          addLog("ui", `Native system alarm notification fired for: "${alert.title}"`);
        } catch (e) {
          // Tolerate notification failures
        }
      }
    });
  }, [activeSevereAlerts, enableBrowserPush, addLog]);

  // Background style pairings matching focal station conditions
  const getBackdropStyles = (condition: string | undefined) => {
    switch (condition) {
      case "Clear":
        return "from-amber-50/45 to-orange-50/15 dark:from-amber-950/20 dark:to-orange-950/5 border-amber-200/50 dark:border-amber-950/20";
      case "Clouds":
        return "from-slate-50/60 to-zinc-50/20 dark:from-slate-900/40 dark:to-zinc-950/15 border-slate-200/50 dark:border-slate-800/40";
      case "Rain":
        return "from-blue-50/70 to-slate-50/15 dark:from-blue-950/20 dark:to-slate-950/5 border-blue-200/40 dark:border-blue-950/30";
      case "Snow":
        return "from-cyan-50/50 to-sky-50/15 dark:from-cyan-950/10 dark:to-sky-950/5 border-cyan-100 dark:border-cyan-900/30";
      case "Storm":
        return "from-purple-50/75 to-indigo-50/15 dark:from-purple-950/25 dark:to-indigo-950/15 border-purple-200/40 dark:border-purple-950/40";
      case "Windy":
        return "from-teal-50/70 to-neutral-50/15 dark:from-teal-950/20 dark:to-neutral-950/5 border-teal-200/40 dark:border-teal-950/30";
      default:
        return "from-indigo-50/55 to-slate-50/15 dark:from-indigo-950/10 dark:to-slate-950/5 border-indigo-200/55 dark:border-indigo-950/35";
    }
  };

  const bgStyles = getBackdropStyles(weather?.current.condition);
  const activeOrder = currentUser?.widgetOrder || DEFAULT_WIDGET_ORDER;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-800 dark:text-gray-100 font-sans transition-colors duration-300 pb-12 select-none">
      
      {/* Absolute top grid wrapper */}
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 pt-4 space-y-6">
        
        {/* Navigation & Sessions segment */}
        <AuthBar
          user={currentUser}
          onSignIn={handleAuthSignIn}
          onSignOut={handleAuthSignOut}
          syncStatus={syncStatus}
          onTriggerManualSync={() => persistPreferencesAndSync(currentUser!)}
        />

        {/* Global Toolbar Panel: Search, Theme & Dashboard Customizable Drawer */}
        <div className="flex flex-col md:flex-row items-center gap-4 justify-between bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          
          {/* Custom autocomplete city search */}
          <div className="w-full md:flex-1 text-left">
            <CitySearch
              onSearch={fetchWeather}
              savedCities={currentUser?.savedCities || []}
              onToggleSaveCity={handleToggleSaveCity}
              activeCity={activeCity}
              isSearching={isSearching}
            />
          </div>

          {/* Configuration drawer toggles and state buttons */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-gray-100 dark:border-gray-800">
            
            {/* Metric / Imperial Selector toggle */}
            <div className="flex items-center gap-1 p-1 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700/50">
              <button
                onClick={() => handleUnitToggle("metric")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  currentUser?.unitSystem === "metric"
                    ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-gray-100 shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
              >
                °C
              </button>
              <button
                onClick={() => handleUnitToggle("imperial")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  currentUser?.unitSystem === "imperial"
                    ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-gray-100 shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
              >
                °F
              </button>
            </div>

            {/* Dashboard Customizer Checklists Toggle */}
            <button
              onClick={() => setShowConfigPanel(!showConfigPanel)}
              className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-center gap-2 text-xs font-medium ${
                showConfigPanel
                  ? "bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-950/50 dark:border-blue-900 dark:text-blue-400"
                  : "bg-gray-50 border-gray-100 dark:bg-gray-800 dark:border-gray-700 text-slate-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-gray-750"
              }`}
              title="Toggle Customizable Dashboard Board Grid Panel"
            >
              <Sliders className="w-4 h-4" />
              <span>Custom Layout</span>
              <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${showConfigPanel ? "rotate-180" : ""}`} />
            </button>

            {/* Theme Button */}
            <ThemeToggle darkMode={darkMode} onThemeToggle={handleThemeToggle} />

          </div>
        </div>

        {/* Customizable Dashboard Order & Layout Panel */}
        {showConfigPanel && currentUser && (
          <div id="customize-layout-panel" className="p-5 rounded-2xl border border-blue-100 dark:border-slate-800 bg-blue-50/5 dark:bg-indigo-950/10 text-left animate-fadeIn">
            <div className="flex items-center gap-2 mb-3">
              <Layout className="w-4.5 h-4.5 text-blue-600" />
              <h4 className="font-bold text-slate-800 dark:text-gray-100 text-xs uppercase tracking-widest">
                Configure Layout Metrics & Ordering
              </h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-gray-400 mb-4 leading-relaxed">
              Enable checkboxes to display components and use the Up (▲) or Down (▼) arrows to control custom positioning layout of your widgets globally. Preferences sync instantly.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {activeOrder.map((widgetId, index) => {
                const isEnabled = currentUser.gridConfig[widgetId as keyof CustomizableGridConfig];
                const humanLabel = widgetId
                  .replace(/([A-Z])/g, " $1")
                  .trim()
                  .replace(/^\w/, (c) => c.toUpperCase());

                return (
                  <div
                    key={widgetId}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                      isEnabled
                        ? "bg-white dark:bg-gray-900 border-blue-200 dark:border-slate-800 text-blue-600 dark:text-blue-400 shadow-sm"
                        : "bg-gray-50/50 dark:bg-gray-950/20 border-gray-100 dark:border-gray-900/60 text-slate-400"
                    }`}
                  >
                    <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={() => handleGridConfigToggle(widgetId as keyof CustomizableGridConfig)}
                        className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                      />
                      <span className="text-xs font-semibold truncate">
                        {humanLabel}
                      </span>
                    </label>

                    {/* Up / Down Arrow controllers */}
                    <div className="flex items-center gap-0.5 ml-2">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleSwapWidgetOrder(index, index - 1)}
                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-400 hover:text-blue-600 disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer"
                        title="Move Up on Dashboard layout"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={index === activeOrder.length - 1}
                        onClick={() => handleSwapWidgetOrder(index, index + 1)}
                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-400 hover:text-blue-600 disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer"
                        title="Move Down on Dashboard layout"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Notification settings drawer toggle channel */}
            <div className="mt-5 pt-4 border-t border-slate-205 dark:border-gray-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5 text-left">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                  Severe weather ambient alerts
                </span>
                <p className="text-[11px] text-slate-500 dark:text-gray-400 leading-normal">
                  Toggle browser push authorization protocols to prompt severities directly on your desktop shell.
                </p>
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                <button
                  type="button"
                  onClick={async () => {
                    const status = await requestNotificationPermission();
                    if (status === "granted") {
                      setEnableBrowserPush(true);
                      localStorage.setItem("aether-push-enabled", "true");
                    } else {
                      setEnableBrowserPush(false);
                      localStorage.setItem("aether-push-enabled", "false");
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition-all ${
                    enableBrowserPush
                      ? "bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-400"
                      : "bg-white border-slate-200 dark:bg-gray-900 dark:border-gray-700 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {enableBrowserPush ? "✔ Device Push Active" : "🔔 Prompt Native desktop notices"}
                </button>
              </div>
            </div>

          </div>
        )}

        {/* Real-time Severe Weather Climate Warnings Panel (Monitoring saved places) */}
        {activeSevereAlerts.length > 0 && (
          <div id="severe-active-hazard-banners" className="space-y-2 text-left bg-transparent">
            <span className="block text-[10px] font-bold uppercase tracking-widest text-red-500 flex items-center gap-1.5 flex-row mt-1 px-1.5 animate-pulse">
              <ShieldAlert className="w-4 h-4 text-red-500 animate-bounce" /> severe Meteorological station alerts (SAVED LOCATIONS CHECK)
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-1.5">
              {activeSevereAlerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className="bg-red-50/80 dark:bg-red-950/20 border border-red-100 dark:border-red-950/40 p-4 rounded-2xl flex items-start gap-4 justify-between shadow-sm relative overflow-hidden transition-all hover:scale-[1.01]"
                >
                  <div className="flex-1 min-w-0">
                    <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-red-500 text-white uppercase tracking-wider mb-2">
                      {alert.city} Warning
                    </span>
                    <h5 className="font-bold text-xs text-red-900 dark:text-red-300">
                      {alert.title}
                    </h5>
                    <p className="text-[11px] text-slate-600 dark:text-gray-350 mt-1 pb-1 leading-relaxed">
                      {alert.description}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDismissAlert(alert.id)}
                    className="p-1 px-2 rounded-lg text-slate-400 hover:text-red-500 bg-white/60 dark:bg-gray-850 hover:bg-white text-xs font-semibold cursor-pointer border border-red-100/30 shrink-0 self-start mt-1.5"
                    title="Silence this alarm advisory"
                  >
                    Dismiss
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bookmarked Cities Drawer (Quick Select Dashboard Tabs with Temperature feeds) */}
        {currentUser && currentUser.savedCities.length > 0 && (
          <div id="saved-cities-bookmarks-panel" className="text-left">
            <span className="block text-[10px] uppercase font-bold tracking-widest text-[#64748b] dark:text-gray-500 mb-2.5 flex items-center gap-1.5 pl-1.5 flex-row">
              <MapPin className="w-3.5 h-3.5 text-blue-500" /> Bookmarked Station Dashboards
            </span>

            <div className="flex gap-2.5 overflow-x-auto pb-1.5 -mx-1 px-1 justify-start">
              {currentUser.savedCities.map((city) => {
                const cacheKey = city.toLowerCase();
                const cache = savedCitiesData[cacheKey];
                const isActive = activeCity.toLowerCase() === cacheKey;

                return (
                  <div
                    key={city}
                    onClick={() => {
                      fetchWeather(city);
                      addLog("ui", `Swapped meteorological dashboard focal point to booked city: "${city}"`);
                    }}
                    className={`flex-shrink-0 flex items-center gap-3 px-4 py-3 rounded-2xl border text-xs font-semibold cursor-pointer transition-all duration-300 ${
                      isActive
                        ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white border-transparent shadow-md shadow-blue-500/15"
                        : "bg-white dark:bg-gray-900 border-slate-205 dark:border-gray-800 text-slate-700 dark:text-gray-300 hover:bg-slate-55 dark:hover:bg-gray-850"
                    }`}
                  >
                    <span>{city}</span>
                    
                    {/* Temperature feed Cache bubble */}
                    {cache ? (
                      <span className={`px-1.5 py-0.5 rounded-lg text-[10px] font-mono ${
                        isActive ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400"
                      }`}>
                        {currentUser.unitSystem === "metric"
                          ? `${Math.round(cache.current.temp)}°C`
                          : `${Math.round((cache.current.temp * 9) / 5 + 32)}°F`}
                      </span>
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-pulse" />
                    )}

                    {/* Quick remove trigger */}
                    <button
                      type="button"
                      onClick={(e) => handleRemoveCityDirectly(city, e)}
                      className={`p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer ${isActive ? "text-white/60 hover:text-white" : "text-slate-400 hover:text-red-500"}`}
                      title={`Remove ${city} from bookmarked list`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Loading segment state */}
        {isLoading ? (
          <div id="meteorology-focal-loader" className="py-24 flex flex-col items-center justify-center space-y-4">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
            <div>
              <p className="font-semibold text-slate-700 dark:text-gray-200 text-sm">
                Gathering Meteorological Insights via Generative AI...
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Resolving pressure indices, forecasts, alerts, and historical curves
              </p>
            </div>
          </div>
        ) : (
          weather && (
            /* Main forecasting content dashboard workspace */
            <div id="weather-dashboard-scaffold" className="space-y-6">
              
              {/* Core Active Card Backdrop representing condition context */}
              <div 
                id="active-city-focal-hero"
                className={`p-6 md:p-8 rounded-3xl border text-left bg-gradient-to-br transition-all duration-700 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 ${bgStyles}`}
              >
                {/* Decorative float light ball */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 dark:bg-indigo-400/5 rounded-full filter blur-3xl translate-x-20 -translate-y-20" />
                
                {/* Left block overview */}
                <div className="z-10 relative">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-blue-100 text-blue-700 dark:bg-indigo-950 dark:text-indigo-300 flex-row">
                      <Sparkles className="w-3 h-3" /> Active Meteorological Focal Node
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      LAT: {weather.lat}°N / LON: {weather.lon}°E
                    </span>
                  </div>

                  {/* Main designation banner */}
                  <h1 className="text-3xl md:text-4xl font-extrabold text-gray-850 dark:text-gray-50 flex items-baseline gap-2 mt-3 tracking-tight">
                    {weather.city}
                    <span className="text-sm font-semibold text-gray-400">
                      {weather.country}
                    </span>
                  </h1>

                  {/* Condition detail */}
                  <p className="text-sm text-gray-500 dark:text-gray-400 capitalize mt-1.5 flex items-center gap-1.5">
                    <span className="font-bold">{weather.current.condition}</span>
                    <span>&bull;</span>
                    <span>{weather.current.description}</span>
                  </p>

                  <div className="mt-4 text-xs font-mono text-gray-400">
                    Solar cycle bounds &bull; Sunrise: {weather.current.sunrise} / Sunset: {weather.current.sunset}
                  </div>
                </div>

                {/* Right Temperature block overview */}
                <div className="z-10 flex items-center gap-6 relative md:text-right md:justify-end">
                  
                  {/* Weather dynamic condition graphic frame */}
                  <div className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center bg-white/40 dark:bg-gray-900/30 rounded-2xl border border-white/50 dark:border-gray-850 backdrop-blur-md shadow-inner transition-transform duration-500 hover:scale-105">
                    <div className="scale-[1.7] md:scale-[2]">
                      {getWeatherIcon(weather.current.condition)}
                    </div>
                  </div>

                  <div>
                    <span className="block text-4xl md:text-5xl font-extrabold text-gray-850 dark:text-gray-50 font-mono tracking-tighter">
                      {currentUser?.unitSystem === "metric"
                        ? `${Math.round(weather.current.temp)}°C`
                        : `${Math.round((weather.current.temp * 9) / 5 + 32)}°F`}
                    </span>
                    <span className="block text-xs text-gray-400 mt-1 uppercase font-bold tracking-widest leading-none">
                      Feels like{" "}
                      {currentUser?.unitSystem === "metric"
                        ? `${Math.round(weather.current.feelsLike)}°C`
                        : `${Math.round((weather.current.feelsLike * 9) / 5 + 32)}°F`}
                    </span>
                  </div>
                </div>

              </div>

              {/* DYNAMIC SHUFFLED DASHBOARD GRID WORKSPACE */}
              <div id="shuffled-dashboard-elements" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
                {activeOrder.map((widgetId) => {
                  const isEnabled = currentUser?.gridConfig[widgetId as keyof CustomizableGridConfig];
                  if (!isEnabled) return null;

                  switch (widgetId) {
                    case "realTimeAlerts":
                      if (!weather.alerts || weather.alerts.length === 0) return null;
                      return (
                        <div key={widgetId} className="col-span-1 md:col-span-2 lg:col-span-4 p-5 rounded-2xl border border-red-100 dark:border-red-950/40 bg-gradient-to-r from-red-50 to-amber-50 dark:from-red-950/20 dark:to-amber-955/10 relative overflow-hidden transition-all">
                          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-5 text-red-500">
                            <ShieldAlert className="w-40 h-40" />
                          </div>
                          <div className="flex items-start gap-4">
                            <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-950/50 text-red-650 dark:text-red-400 shrink-0">
                              <ShieldAlert className="w-5 h-5 animate-bounce" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-bold text-red-800 dark:text-red-300 uppercase tracking-widest flex items-center gap-2">
                                Station Warnings: {weather.city}
                                <span className="animate-pulse h-2 w-2 rounded-full bg-red-500" />
                              </h4>
                              <div className="mt-3 space-y-3">
                                {weather.alerts.map((alert) => (
                                  <div key={alert.id} className="border-l-2 border-red-400 dark:border-red-600 pl-3">
                                    <span className="block text-xs font-bold text-gray-800 dark:text-gray-100">
                                      {alert.title} — ({alert.source})
                                    </span>
                                    <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1 pb-1 leading-relaxed">
                                      {alert.description}
                                    </span>
                                    <span className="block text-[10px] text-gray-400 font-mono">
                                      Expiration Active: active until {alert.expires}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      );

                    case "aiBriefing":
                      return (
                        <div key={widgetId} className="col-span-1 md:col-span-2 lg:col-span-2 p-5 rounded-2xl border border-blue-105 dark:border-blue-950/30 bg-white dark:bg-gray-900 text-left relative overflow-hidden flex flex-col justify-between transition-all shadow-sm">
                          <div className="absolute right-0 top-0 translate-x-5 -translate-y-5 opacity-5 text-blue-600">
                            <BrainCircuit className="w-32 h-32" />
                          </div>
                          <div className="flex gap-3 items-start">
                            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-indigo-950/40 text-blue-600 dark:text-blue-400 shrink-0">
                              <BrainCircuit className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <span className="block text-[10px] font-bold text-blue-600 dark:text-blue-455 tracking-wider uppercase mb-1">
                                Gemini Deep Insights
                              </span>
                              <h4 className="font-semibold text-slate-800 dark:text-gray-150 text-sm leading-snug">
                                Air Intelligence brief & advises
                              </h4>
                              <p className="text-xs text-slate-700 dark:text-gray-300 mt-3 leading-relaxed">
                                {weather.aiBriefing}
                              </p>
                              
                              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-gray-850/50">
                                <span className="block text-[10px] font-bold text-slate-400 tracking-wide uppercase mb-1 flex items-center gap-1.5 flex-row">
                                  <Bookmark className="w-3 h-3 text-blue-500" /> Wear & Activity Note suggestion
                                </span>
                                <p className="text-xs text-slate-550 dark:text-gray-400 italic leading-relaxed">
                                  {weather.aiPersonalNotes}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );

                    case "hourlyForecast":
                      return (
                        <div key={widgetId} className="col-span-1 md:col-span-2 lg:col-span-4">
                          <HourlyForecastSlider hourly={weather.hourly} unitSystem={currentUser.unitSystem} />
                        </div>
                      );

                    case "windSystem":
                      return (
                        <div key={widgetId} className="col-span-1 p-5 rounded-2xl border border-slate-205 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm text-left flex flex-col justify-between transition-all">
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                                Wind Compass
                              </span>
                              <Wind className="w-4 h-4 text-slate-400" />
                            </div>
                            <div className="flex items-center gap-4">
                              <div 
                                className="relative w-14 h-14 rounded-full border border-slate-200 dark:border-gray-800 flex items-center justify-center bg-slate-50 dark:bg-gray-950 transition-transform shadow-inner shrink-0"
                                title={`Wind heading degrees: ${weather.current.windDeg}°`}
                              >
                                <div 
                                  className="w-full h-full absolute transition-transform duration-700 flex items-center justify-center" 
                                  style={{ transform: `rotate(${weather.current.windDeg}deg)` }}
                                >
                                  <Compass className="w-8 h-8 text-blue-600 dark:text-indigo-400" />
                                </div>
                                <span className="text-[10px] text-slate-500 font-bold z-10 font-mono">
                                  {weather.current.windDeg}°
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="block text-2xl font-bold font-mono tracking-tight text-gray-800 dark:text-gray-100 truncate">
                                  {currentUser.unitSystem === "metric"
                                    ? `${weather.current.windSpeed} m/s`
                                    : `${Math.round(weather.current.windSpeed * 2.237)} mph`}
                                </span>
                                <span className="block text-xs text-gray-400 mt-1">
                                  Absolute velocity vectors
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 pt-3 border-t border-gray-50 dark:border-gray-850/30">
                            <span className="text-[10px] text-gray-400 leading-normal">
                              Meteor force streams pointing across geographic planes.
                            </span>
                          </div>
                        </div>
                      );

                    case "humidityPressure":
                      return (
                        <div key={widgetId} className="col-span-1 p-5 rounded-2xl border border-slate-205 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm text-left flex flex-col justify-between transition-all">
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                                Air Humidity
                              </span>
                              <Droplets className="w-4 h-4 text-blue-500" />
                            </div>
                            
                            <div className="flex items-end justify-between gap-1">
                              <div>
                                <span className="block text-2xl font-bold font-mono tracking-tight text-slate-800 dark:text-gray-100 font-mono">
                                  {weather.current.humidity}%
                                </span>
                                <span className="block text-xs text-slate-400 mt-1">
                                  Ambient moisture index
                                </span>
                              </div>
                              <div className="w-16 h-2 bg-slate-100 dark:bg-gray-800 rounded-full overflow-hidden mb-1.5 shadow-inner shrink-0">
                                <div 
                                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                  style={{ width: `${weather.current.humidity}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-105 dark:border-gray-850/40 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5">
                              <Gauge className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-xs font-semibold text-slate-750 dark:text-gray-300 font-mono">
                                {weather.current.pressure} hPa
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400">Pressure</span>
                          </div>
                        </div>
                      );

                    case "sunAndUv":
                      const isLow = weather.current.uvi <= 2;
                      const isMod = weather.current.uvi <= 5;
                      const uvColor = isLow ? "text-green-500" : isMod ? "text-amber-500" : "text-rose-500";
                      return (
                        <div key={widgetId} className="col-span-1 p-5 rounded-2xl border border-slate-205 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm text-left flex flex-col justify-between transition-all">
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                                Solar UV Index
                              </span>
                              <Sun className="w-4 h-4 text-amber-500" />
                            </div>

                            <div className="flex items-end justify-between gap-1">
                              <div>
                                <span className="block text-2xl font-bold font-mono tracking-tight text-slate-800 dark:text-gray-100 font-mono">
                                  {weather.current.uvi}
                                </span>
                                <span className={`block text-xs font-semibold mt-1 ${uvColor}`}>
                                  {weather.current.uvi <= 2 ? "Low" : weather.current.uvi <= 5 ? "Moderate" : "High"} Risk
                                </span>
                              </div>
                              <div className="flex gap-0.5 pb-2.5 shrink-0">
                                {Array.from({ length: 4 }).map((_, i) => (
                                  <div
                                    key={i}
                                    className={`h-2.5 w-1 rounded-full transition-all duration-300 ${
                                      i < Math.min(4, Math.ceil(weather.current.uvi / 3))
                                        ? "bg-amber-500"
                                        : "bg-slate-100 dark:bg-gray-800"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-gray-850/40 flex justify-between items-center text-[10px] text-slate-400">
                            <span className="font-mono text-[9px]">Sunrise: {weather.current.sunrise}</span>
                            <span className="font-mono text-[9px]">Sunset: {weather.current.sunset}</span>
                          </div>
                        </div>
                      );

                    case "dailyForecast":
                      return (
                        <div key={widgetId} className="col-span-1 md:col-span-2">
                          <DailyForecastList forecast={weather.forecast} unitSystem={currentUser.unitSystem} />
                        </div>
                      );

                    case "historicalCharts":
                      return (
                        <div key={widgetId} className="col-span-1 md:col-span-2">
                          <HistoricalCharts 
                            activeCity={activeCity} 
                            historicalData={weather.historical} 
                            savedCitiesData={savedCitiesData} 
                            unitSystem={currentUser.unitSystem} 
                          />
                        </div>
                      );

                    default:
                      return null;
                  }
                })}
              </div>

            </div>
          )
        )}

        {/* Diagnostic operations center footer (Troubleshooter and Conflict Selector) */}
        <DiagnosticCenter
          logs={logs}
          onClearLogs={() => {
            setLogs([]);
            addLog("ui", "Debug log cache manually flushed.");
          }}
          syncPolicy={syncPolicy}
          onSyncPolicyChange={(p) => {
            setSyncPolicy(p);
            addLog("ui", `Conflict policy swapped to: "${p}"`);
          }}
          firebaseActive={isFirebaseLive}
          syncStatus={syncStatus}
          onTriggerManualSync={() => {
            if (currentUser) {
              persistPreferencesAndSync(currentUser);
            }
          }}
        />

        <div id="footer" className="text-center text-[10px] text-gray-400 mt-8 pt-4 border-t border-gray-100 dark:border-gray-900">
          AETHER Weather Intelligence Suite &copy; {new Date().getFullYear()} &bull; Crafted with absolute typography precision
        </div>

      </div>

    </div>
  );
}
