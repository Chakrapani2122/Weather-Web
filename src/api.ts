import { WeatherDataPayload } from "./types";

export async function fetchWeatherData(city: string): Promise<WeatherDataPayload> {
  const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
  if (!response.ok) {
    throw new Error("City not found");
  }
  return response.json();
}
