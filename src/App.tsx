import React, { useState, useEffect, useCallback } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, isFirebaseLive, signInWithGoogle, handleSignOut } from "./firebase";
import { fetchWeatherData } from "./api";
import { useWeatherAlerts } from "./useWeatherAlerts";
import {
  WeatherDataPayload,
  UserDashboardPreferences,
  CustomizableGridConfig,
} from "./types";
import AuthBar from "./components/AuthBar";
import CitySearch from "./components/CitySearch";
import HourlyForecastSlider from "./components/HourlyForecastSlider";
import DailyForecastList from "./components/DailyForecastList";
import DashboardGrid from "./components/DashboardGrid";
import HistoricalCharts from "./components/HistoricalCharts";
import DashboardCustomizer from "./components/DashboardCustomizer";
import { RefreshCw } from "lucide-react";

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

const DEFAULT_PREFERENCES: UserDashboardPreferences = {
  uid: "local-user",
  email: "local@example.com",
  displayName: "GUEST User",
  photoURL: null,
  savedCities: ["Singapore", "London", "New York", "Tokyo"],
  unitSystem: "metric",
  gridConfig: DEFAULT_GRID_CONFIG,
  updatedAt: Date.now(),
};

export default function App() {
  const [activeCity, setActiveCity] = useState(INITIAL_CITY);
  const [weather, setWeather] = useState<WeatherDataPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // App Synchronization & Identity states
  const [currentUser, setCurrentUser] = useState<UserDashboardPreferences | null>(null);
  const [syncStatus, setSyncStatus] = useState<"synced" | "local-only" | "conflict" | "syncing" | "error">("local-only");

  // Mount real-time alert listener
  useWeatherAlerts(currentUser);

  // Fetch core weather for a specific city using OWM API
  const fetchWeather = useCallback(async (city: string) => {
    setIsSearching(true);
    try {
      const data = await fetchWeatherData(city);
      setWeather(data);
      setActiveCity(data.city);
    } catch (err: any) {
      console.error("Failed to fetch weather", err);
    } finally {
      setIsSearching(false);
      setIsLoading(false);
    }
  }, []);

  // Trigger weather on mount
  useEffect(() => {
    fetchWeather(activeCity);
  }, [fetchWeather, activeCity]);

  // Sync state upward to Firestore or offline LocalStorage
  const persistPreferencesAndSync = async (nextPrefs: UserDashboardPreferences) => {
    localStorage.setItem("aether-prefs", JSON.stringify(nextPrefs));
    setCurrentUser(nextPrefs);

    if (!isFirebaseLive || !auth?.currentUser || !db) {
      setSyncStatus("local-only");
      return;
    }

    setSyncStatus("syncing");
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
        updatedAt: Date.now(),
      });
      setSyncStatus("synced");
    } catch (err: any) {
      setSyncStatus("error");
    }
  };

  // Google Authentication Listener
  useEffect(() => {
    if (!isFirebaseLive || !auth) return;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
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
            persistPreferencesAndSync(cloudPrefs);
            setSyncStatus("synced");
          } else {
            const newCloudPrefs: UserDashboardPreferences = {
              ...localPrefs,
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              updatedAt: Date.now(),
            };
            persistPreferencesAndSync(newCloudPrefs);
          }
        } catch (e: any) {
          setSyncStatus("error");
        }
      } else {
        const localPrefsRaw = localStorage.getItem("aether-prefs");
        if (localPrefsRaw) {
          const localPrefs = JSON.parse(localPrefsRaw) as UserDashboardPreferences;
          setCurrentUser({
            ...localPrefs,
            uid: "local-user",
            displayName: "Guest User",
            photoURL: null,
          });
        } else {
          setCurrentUser(DEFAULT_PREFERENCES);
        }
        setSyncStatus("local-only");
      }
    });

    return () => unsubscribe();
  }, []);

  const handleAuthSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleAuthSignOut = async () => {
    try {
      await handleSignOut();
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleToggleSaveCity = (city: string) => {
    if (!currentUser) return;
    const clean = city.trim();
    const cityList = [...currentUser.savedCities];
    const matchIdx = cityList.findIndex((c) => c.toLowerCase() === clean.toLowerCase());

    if (matchIdx >= 0) {
      cityList.splice(matchIdx, 1);
    } else {
      cityList.push(clean);
    }

    persistPreferencesAndSync({ ...currentUser, savedCities: cityList });
  };

  const handleUpdateConfig = (newConfig: CustomizableGridConfig) => {
    if (!currentUser) return;
    persistPreferencesAndSync({ ...currentUser, gridConfig: newConfig });
  };

  // Background style pairings matching focal station conditions
  const getBackdropStyles = (condition: string | undefined, time: string | undefined) => {
    if (isDarkMode) return "bg-gray-950"; // Solid dark mode override

    const isNight = time && (time.includes("PM") && parseInt(time.split(":")[0]) >= 7 || time.includes("AM") && parseInt(time.split(":")[0]) <= 5);
    
    if (isNight) return "from-[#08182b] to-[#122b49]";

    switch (condition) {
      case "Clear": return "from-[#4a90e2] to-[#63b8ff]";
      case "Clouds": return "from-[#6a85b6] to-[#bac8e0]";
      case "Rain": return "from-[#3a506b] to-[#5b7c99]";
      case "Snow": return "from-[#90bafc] to-[#c7dfff]";
      case "Storm": return "from-[#28313b] to-[#485461]";
      case "Windy": return "from-[#5f869f] to-[#7fa1b6]";
      default: return "from-[#4a90e2] to-[#63b8ff]";
    }
  };

  const bgStyles = getBackdropStyles(weather?.current.condition, weather?.hourly?.[0]?.time);
  const isMetric = currentUser?.unitSystem === "metric" ?? true;
  const config = currentUser?.gridConfig || DEFAULT_GRID_CONFIG;

  const getHighLow = () => {
    if (!weather?.forecast?.[0]) return { h: 0, l: 0 };
    const today = weather.forecast[0];
    const h = isMetric ? Math.round(today.maxTemp) : Math.round((today.maxTemp * 9) / 5 + 32);
    const l = isMetric ? Math.round(today.minTemp) : Math.round((today.minTemp * 9) / 5 + 32);
    return { h, l };
  };
  const { h, l } = getHighLow();

  return (
    <div className={`min-h-screen ${isDarkMode ? bgStyles : `bg-gradient-to-b ${bgStyles}`} text-white font-sans transition-colors duration-1000`}>
      <div className="max-w-2xl mx-auto min-h-screen flex flex-col pt-safe">
        
        <AuthBar
          user={currentUser}
          onSignIn={handleAuthSignIn}
          onSignOut={handleAuthSignOut}
          syncStatus={syncStatus}
          onTriggerManualSync={() => currentUser && persistPreferencesAndSync(currentUser)}
        />

        <div className="px-4 py-2 z-30 relative">
          <CitySearch
            onSearch={fetchWeather}
            savedCities={currentUser?.savedCities || []}
            onToggleSaveCity={handleToggleSaveCity}
            activeCity={activeCity}
            isSearching={isSearching}
          />
        </div>

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4">
            <RefreshCw className="w-8 h-8 animate-spin text-white/50" />
          </div>
        ) : (
          weather && (
            <div className="flex-1 overflow-y-auto no-scrollbar pb-24 px-4 space-y-4 z-10 relative">
              
              {/* Hero Section */}
              <div className="flex flex-col items-center justify-center py-8 text-shadow-sm">
                <h1 className="text-3xl font-normal tracking-wide drop-shadow-md">
                  {weather.city}
                </h1>
                <div className="text-[6rem] font-extralight tracking-tighter leading-none mt-1 drop-shadow-lg">
                  {isMetric
                    ? `${Math.round(weather.current.temp)}°`
                    : `${Math.round((weather.current.temp * 9) / 5 + 32)}°`}
                </div>
                <div className="text-xl font-medium tracking-wide drop-shadow-md capitalize">
                  {weather.current.description}
                </div>
                <div className="text-lg font-medium drop-shadow-md flex gap-3 mt-1">
                  <span>H:{h}°</span>
                  <span>L:{l}°</span>
                </div>
              </div>

              {/* Customizable Widgets */}
              {config.hourlyForecast && (
                <HourlyForecastSlider hourly={weather.hourly} unitSystem={currentUser?.unitSystem || "metric"} />
              )}

              {config.dailyForecast && (
                <DailyForecastList forecast={weather.forecast} unitSystem={currentUser?.unitSystem || "metric"} />
              )}

              {config.historicalCharts && (
                <HistoricalCharts data={weather.historical} unitSystem={currentUser?.unitSystem || "metric"} />
              )}

              <DashboardGrid
                current={weather.current}
                alerts={config.realTimeAlerts ? weather.alerts : []}
                unitSystem={currentUser?.unitSystem || "metric"}
                aiBriefing={config.aiBriefing ? weather.aiBriefing : ""}
                aiPersonalNotes={config.aiBriefing ? weather.aiPersonalNotes : ""}
              />

              <div className="text-center text-white/40 text-xs py-8">
                Weather Data Provided by OpenWeather
              </div>
            </div>
          )
        )}
      </div>

      <DashboardCustomizer 
        config={config} 
        onUpdate={handleUpdateConfig} 
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />
    </div>
  );
}
