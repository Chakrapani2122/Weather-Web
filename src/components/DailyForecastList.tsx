import { Calendar } from "lucide-react";
import { DailyForecast, UnitSystem } from "../types";

export const getWeatherIcon = (condition: string) => {
  switch (condition) {
    case "Clear":
      return <span className="text-yellow-400 text-lg md:text-xl drop-shadow-sm">☀️</span>;
    case "Clouds":
      return <span className="text-gray-300 text-lg md:text-xl drop-shadow-sm">☁️</span>;
    case "Rain":
      return <span className="text-blue-400 text-lg md:text-xl drop-shadow-sm">🌧️</span>;
    case "Snow":
      return <span className="text-blue-200 text-lg md:text-xl drop-shadow-sm">❄️</span>;
    case "Storm":
      return <span className="text-purple-400 text-lg md:text-xl drop-shadow-sm">⛈️</span>;
    case "Windy":
      return <span className="text-teal-300 text-lg md:text-xl drop-shadow-sm">💨</span>;
    default:
      return <span className="text-gray-400 text-lg md:text-xl drop-shadow-sm">🌤️</span>;
  }
};

interface DailyForecastListProps {
  forecast: DailyForecast[];
  unitSystem: UnitSystem;
}

export default function DailyForecastList({ forecast, unitSystem }: DailyForecastListProps) {
  const isMetric = unitSystem === "metric";

  // Find min and max for the week to calculate gradient bars correctly
  const weekMin = Math.min(...forecast.map(d => d.minTemp));
  const weekMax = Math.max(...forecast.map(d => d.maxTemp));
  const tempRange = weekMax - weekMin || 1;

  return (
    <div className="glass-panel p-4">
      <div className="flex items-center gap-1.5 text-white/70 mb-3 border-b border-white/10 pb-2">
        <Calendar className="w-3.5 h-3.5" />
        <span className="text-[11px] font-semibold uppercase tracking-wider">
          7-Day Forecast
        </span>
      </div>

      <div className="flex flex-col space-y-3 mt-2">
        {forecast.map((day, index) => {
          const minT = isMetric ? Math.round(day.minTemp) : Math.round((day.minTemp * 9) / 5 + 32);
          const maxT = isMetric ? Math.round(day.maxTemp) : Math.round((day.maxTemp * 9) / 5 + 32);
          
          const leftPercent = ((day.minTemp - weekMin) / tempRange) * 100;
          const widthPercent = ((day.maxTemp - day.minTemp) / tempRange) * 100;

          return (
            <div key={index} className="flex items-center justify-between text-white">
              <span className="w-16 font-medium text-base">
                {index === 0 ? "Today" : day.day.substring(0, 3)}
              </span>
              
              <div className="flex-shrink-0 w-8 flex justify-center">
                {getWeatherIcon(day.condition)}
              </div>

              <div className="flex items-center gap-3 flex-1 ml-4">
                <span className="w-8 text-right text-white/60 font-semibold text-base">
                  {minT}°
                </span>
                
                {/* Temperature Range Bar */}
                <div className="flex-1 h-1.5 bg-black/20 rounded-full overflow-hidden relative">
                  <div 
                    className="absolute h-full rounded-full bg-gradient-to-r from-blue-400 via-green-400 to-yellow-400"
                    style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                  />
                </div>
                
                <span className="w-8 text-left font-semibold text-base">
                  {maxT}°
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
