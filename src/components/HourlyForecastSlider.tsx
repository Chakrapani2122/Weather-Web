import { Clock } from "lucide-react";
import { HourlyForecast, UnitSystem } from "../types";
import { getWeatherIcon } from "./DailyForecastList";

interface HourlyForecastSliderProps {
  hourly: HourlyForecast[];
  unitSystem: UnitSystem;
}

export default function HourlyForecastSlider({ hourly, unitSystem }: HourlyForecastSliderProps) {
  const isMetric = unitSystem === "metric";

  return (
    <div className="glass-panel p-4">
      <div className="flex items-center gap-1.5 text-white/70 mb-3 border-b border-white/10 pb-2">
        <Clock className="w-3.5 h-3.5" />
        <span className="text-[11px] font-semibold uppercase tracking-wider">
          Hourly Forecast
        </span>
      </div>
      
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 pt-1">
        {hourly.map((hour, index) => {
          const temp = isMetric ? Math.round(hour.temp) : Math.round((hour.temp * 9) / 5 + 32);
          const isNow = index === 0;

          return (
            <div key={index} className="flex flex-col items-center flex-shrink-0 min-w-[50px]">
              <span className={`text-sm ${isNow ? "font-bold text-white" : "font-medium text-white/90"}`}>
                {isNow ? "Now" : hour.time.replace(":00", "").replace(" ", "")}
              </span>
              <div className="my-2">
                {getWeatherIcon(hour.condition)}
              </div>
              <span className="text-base font-semibold text-white">
                {temp}°
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
