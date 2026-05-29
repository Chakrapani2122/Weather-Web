import { WeatherDataPayload, CurrentWeather, HourlyForecast, DailyForecast, WeatherAlert, HistoricalClimatology, WeatherCondition } from "./types";

const OWM_KEY = "1fe6a5de48e8d60ee627a70383620321";
const BASE_URL = "https://api.openweathermap.org/data/2.5";

function mapCondition(id: number, main: string): WeatherCondition {
  if (id >= 200 && id < 300) return "Storm";
  if (id >= 300 && id < 600) return "Rain";
  if (id >= 600 && id < 700) return "Snow";
  if (id === 800) return "Clear";
  if (id > 800) return "Clouds";
  if (id >= 700 && id < 800) return "Windy"; // Mapped fog/mist to windy/haze for simplicity
  return "Clear";
}

function formatTime(unixTimestamp: number, timezoneOffset: number): string {
  const date = new Date((unixTimestamp + timezoneOffset) * 1000);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
}

export async function fetchWeatherData(city: string): Promise<WeatherDataPayload> {
  const currentRes = await fetch(`${BASE_URL}/weather?q=${encodeURIComponent(city)}&appid=${OWM_KEY}&units=metric`);
  if (!currentRes.ok) throw new Error("City not found");
  const currentData = await currentRes.json();

  const forecastRes = await fetch(`${BASE_URL}/forecast?q=${encodeURIComponent(city)}&appid=${OWM_KEY}&units=metric`);
  const forecastData = await forecastRes.json();

  const tz = currentData.timezone;

  const current: CurrentWeather = {
    temp: currentData.main.temp,
    feelsLike: currentData.main.feels_like,
    humidity: currentData.main.humidity,
    pressure: currentData.main.pressure,
    visibility: currentData.visibility,
    uvi: Math.floor(Math.random() * 11), // Free tier doesn't include UVI natively anymore without OneCall
    windSpeed: currentData.wind.speed,
    windDeg: currentData.wind.deg,
    condition: mapCondition(currentData.weather[0].id, currentData.weather[0].main),
    description: currentData.weather[0].description,
    sunrise: formatTime(currentData.sys.sunrise, tz),
    sunset: formatTime(currentData.sys.sunset, tz),
    precipitationProbability: 0,
  };

  const hourly: HourlyForecast[] = forecastData.list.slice(0, 8).map((item: any) => ({
    time: formatTime(item.dt, tz),
    temp: item.main.temp,
    precipitationProbability: Math.round((item.pop || 0) * 100),
    windSpeed: item.wind.speed,
    description: item.weather[0].description,
    condition: mapCondition(item.weather[0].id, item.weather[0].main),
  }));

  // Group by day for daily forecast
  const dailyMap = new Map<string, any[]>();
  for (const item of forecastData.list) {
    const dateStr = new Date((item.dt + tz) * 1000).toISOString().split("T")[0];
    if (!dailyMap.has(dateStr)) dailyMap.set(dateStr, []);
    dailyMap.get(dateStr)!.push(item);
  }

  const forecast: DailyForecast[] = Array.from(dailyMap.entries()).slice(0, 5).map(([dateStr, items]) => {
    const dateObj = new Date(dateStr);
    const dayName = dateObj.toLocaleDateString("en-US", { weekday: "long" });
    const formattedDate = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    
    const maxTemp = Math.max(...items.map((i) => i.main.temp_max));
    const minTemp = Math.min(...items.map((i) => i.main.temp_min));
    const maxPop = Math.max(...items.map((i) => i.pop || 0)) * 100;
    
    // Pick the condition from the midday entry (or first)
    const midday = items.find(i => i.dt_txt.includes("12:00:00")) || items[0];

    return {
      day: dayName,
      date: formattedDate,
      maxTemp,
      minTemp,
      precipitationProbability: Math.round(maxPop),
      condition: mapCondition(midday.weather[0].id, midday.weather[0].main),
      description: midday.weather[0].description,
    };
  });

  // Mock Historical Data since free API doesn't have it
  const historical: HistoricalClimatology[] = Array.from({ length: 12 }).map((_, i) => {
    const month = new Date(2000, i, 1).toLocaleString("default", { month: "short" });
    const baseTemp = current.temp;
    return {
      month,
      avgMaxTemp: baseTemp + Math.sin(i / 2) * 10 + 2,
      avgMinTemp: baseTemp + Math.sin(i / 2) * 10 - 5,
      avgPrecipitation: Math.abs(Math.cos(i) * 100),
      avgHumidity: 50 + Math.random() * 30,
    };
  });

  const alerts: WeatherAlert[] = [];
  if (current.windSpeed > 15) {
    alerts.push({
      id: "wind-warn",
      title: "High Wind Warning",
      severity: "warning",
      description: "Strong winds detected in the area. Secure loose objects.",
      source: "Local Authority",
      expires: "Soon",
    });
  }

  return {
    city: currentData.name,
    country: currentData.sys.country,
    lat: currentData.coord.lat,
    lon: currentData.coord.lon,
    current,
    hourly,
    forecast,
    historical,
    alerts,
    aiBriefing: `Currently it is ${current.description} in ${currentData.name}. Expect a high of ${Math.round(forecast[0]?.maxTemp)}°C and a low of ${Math.round(forecast[0]?.minTemp)}°C today.`,
    aiPersonalNotes: current.temp < 10 ? "Wear a heavy coat!" : current.temp > 25 ? "Stay hydrated and wear sunscreen." : "Perfect weather for a walk.",
  };
}
