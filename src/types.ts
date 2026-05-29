export type UnitSystem = "metric" | "imperial";

export type WeatherCondition = "Clear" | "Clouds" | "Rain" | "Snow" | "Storm" | "Windy";

export interface WeatherConditionDetails {
  id: number;
  main: WeatherCondition;
  description: string;
  icon: string;
}

export interface CurrentWeather {
  temp: number;
  feelsLike: number;
  humidity: number;
  pressure: number;
  visibility: number; // in meters
  uvi: number; // UV Index
  windSpeed: number; // m/s or mph
  windDeg: number;
  condition: WeatherCondition;
  description: string;
  sunrise: string; // e.g. "06:12 AM"
  sunset: string;  // e.g. "06:45 PM"
  precipitationProbability: number; // percentage
}

export interface HourlyForecast {
  time: string; // e.g., "08:00 AM"
  temp: number;
  precipitationProbability: number;
  windSpeed: number;
  description: string;
  condition: WeatherCondition;
}

export interface DailyForecast {
  day: string; // e.g., "Monday"
  date: string; // e.g., "May 30"
  maxTemp: number;
  minTemp: number;
  precipitationProbability: number;
  condition: WeatherCondition;
  description: string;
}

export interface HistoricalClimatology {
  month: string; // e.g., "Jan", "Feb"
  avgMaxTemp: number;
  avgMinTemp: number;
  avgPrecipitation: number; // mm
  avgHumidity: number; // percentage
}

export interface WeatherAlert {
  id: string;
  title: string;
  severity: "info" | "warning" | "danger";
  description: string;
  source: string;
  expires: string;
}

export interface WeatherDataPayload {
  city: string;
  country: string;
  lat: number;
  lon: number;
  current: CurrentWeather;
  hourly: HourlyForecast[];
  forecast: DailyForecast[];
  historical: HistoricalClimatology[];
  alerts: WeatherAlert[];
  aiBriefing: string; // General breakdown
  aiPersonalNotes: string; // Clothing suggestions, plans advice
}

export interface CustomizableGridConfig {
  hourlyForecast: boolean;
  dailyForecast: boolean;
  historicalCharts: boolean;
  humidityPressure: boolean;
  windSystem: boolean;
  sunAndUv: boolean;
  aiBriefing: boolean;
  realTimeAlerts: boolean;
}

export interface UserDashboardPreferences {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  savedCities: string[];
  unitSystem: UnitSystem;
  gridConfig: CustomizableGridConfig;
  widgetOrder?: string[];
  updatedAt: number; // server timestamp or millisecond number
}

// Interface for reporting network/runtime diagnostic logs
export interface DiagnosticLog {
  id: string;
  timestamp: string;
  category: "network" | "firebase" | "weather-gen" | "ui";
  message: string;
  severity: "info" | "warning" | "error";
}
