import { useEffect, useRef } from "react";
import { fetchWeatherData } from "./api";
import { UserDashboardPreferences } from "../types";

export function useWeatherAlerts(user: UserDashboardPreferences | null) {
  const alertedCities = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user || user.savedCities.length === 0) return;

    // Check if browser supports notifications
    if (!("Notification" in window)) {
      console.warn("This browser does not support desktop notification");
      return;
    }

    const checkConditions = async () => {
      // Request permission if not granted
      if (Notification.permission === "default") {
        await Notification.requestPermission();
      }

      if (Notification.permission === "granted") {
        for (const city of user.savedCities) {
          try {
            const data = await fetchWeatherData(city);
            
            // Check for severe conditions
            const isSevere = data.alerts.length > 0 || data.current.condition === "Storm" || data.current.temp > 40 || data.current.temp < -15;

            if (isSevere && !alertedCities.current.has(city)) {
              alertedCities.current.add(city);
              new Notification(`Severe Weather Alert: ${city}`, {
                body: data.alerts[0]?.description || `Severe condition detected: ${data.current.description}`,
                icon: "/vite.svg"
              });
            } else if (!isSevere) {
              // Clear alert state if condition improves
              alertedCities.current.delete(city);
            }
          } catch (e) {
            // Silently fail for background tasks
          }
        }
      }
    };

    // Initial check
    checkConditions();

    // Poll every 30 minutes
    const interval = setInterval(checkConditions, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);
}
