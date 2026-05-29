import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, Wind, ThermometerSnowflake } from "lucide-react";
import { DailyForecast, UnitSystem, WeatherCondition } from "../types";

export function getWeatherIcon(condition: WeatherCondition, sizeClass = "w-5 h-5") {
  switch (condition) {
    case "Clear":
      return <Sun className={`${sizeClass} text-amber-500`} />;
    case "Clouds":
      return <Cloud className={`${sizeClass} text-slate-400 dark:text-slate-500`} />;
    case "Rain":
      return <CloudRain className={`${sizeClass} text-blue-500`} />;
    case "Snow":
      return <CloudSnow className={`${sizeClass} text-cyan-400`} />;
    case "Storm":
      return <CloudLightning className={`${sizeClass} text-purple-500`} />;
    case "Windy":
      return <Wind className={`${sizeClass} text-teal-400`} />;
    default:
      return <Sun className={`${sizeClass} text-amber-500`} />;
  }
}

interface DailyForecastListProps {
  forecast: DailyForecast[];
  unitSystem: UnitSystem;
}

export default function DailyForecastList({ forecast, unitSystem }: DailyForecastListProps) {
  const isMetric = unitSystem === "metric";
  const tempUnit = isMetric ? "°C" : "°F";

  const formatTemp = (c: number) => {
    if (isMetric) return `${Math.round(c)}${tempUnit}`;
    return `${Math.round((c * 9) / 5 + 32)}${tempUnit}`;
  };

  return (
    <div id="daily-forecast-container" className="p-5 rounded-2xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm transition-colors duration-300">
      <h3 className="font-semibold text-slate-800 dark:text-gray-100 mb-4 flex items-center gap-2 text-sm md:text-base">
        <ThermometerSnowflake className="w-4.5 h-4.5 text-blue-600" /> 7-Day Atmospheric Outlook
      </h3>
      
      <div className="space-y-3">
        {forecast.map((day, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-gray-800/60 hover:bg-slate-50/50 dark:hover:bg-gray-850/20 transition-colors"
          >
            {/* Day and Date */}
            <div className="w-24 text-left">
              <span className="block text-xs font-semibold text-gray-800 dark:text-gray-200">
                {idx === 0 ? "Today" : day.day}
              </span>
              <span className="block text-[10px] text-gray-400 mt-0.5">
                {day.date}
              </span>
            </div>

            {/* Condition Icon & Description */}
            <div className="flex-1 flex items-center gap-2.5 px-2">
              {getWeatherIcon(day.condition)}
              <span className="text-xs text-gray-500 dark:text-gray-400 capitalize hidden sm:inline-block leading-normal">
                {day.description}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 capitalize inline-block sm:hidden leading-normal">
                {day.condition}
              </span>
            </div>

            {/* Precipitation probability bubble */}
            <div className="w-16 text-center">
              {day.precipitationProbability > 15 ? (
                <span className="inline-block text-[10px] bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">
                  {day.precipitationProbability}% Rain
                </span>
              ) : (
                <span className="text-[10px] text-gray-400">-</span>
              )}
            </div>

            {/* Range high & low bar */}
            <div className="w-20 text-right flex items-center justify-end gap-2.5">
              <span className="text-xs font-semibold text-gray-800 dark:text-gray-200" title="Daily high">
                {formatTemp(day.maxTemp)}
              </span>
              <span className="text-xs font-medium text-gray-400" title="Daily low">
                {formatTemp(day.minTemp)}
              </span>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
