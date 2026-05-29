import { AlarmClock, Droplet, Wind } from "lucide-react";
import { HourlyForecast, UnitSystem } from "../types";
import { getWeatherIcon } from "./DailyForecastList";

interface HourlyForecastSliderProps {
  hourly: HourlyForecast[];
  unitSystem: UnitSystem;
}

export default function HourlyForecastSlider({ hourly, unitSystem }: HourlyForecastSliderProps) {
  const isMetric = unitSystem === "metric";
  const tempUnit = isMetric ? "°C" : "°F";
  const speedUnit = isMetric ? "m/s" : "mph";

  const formatTemp = (c: number) => {
    if (isMetric) return `${Math.round(c)}${tempUnit}`;
    return `${Math.round((c * 9) / 5 + 32)}${tempUnit}`;
  };

  const formatSpeed = (ms: number) => {
    if (isMetric) return `${ms} ${speedUnit}`;
    return `${Math.round(ms * 2.237)} ${speedUnit}`;
  };

  return (
    <div id="hourly-slider-container" className="p-5 rounded-2xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm transition-colors duration-300">
      
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-800 dark:text-gray-100 flex items-center gap-2 text-sm md:text-base">
          <AlarmClock className="w-4.5 h-4.5 text-blue-600" /> 24-Hour Timeline Forecast
        </h3>
        <span className="text-[10px] text-slate-400 font-mono">
          Scroll horizontally &rarr;
        </span>
      </div>

      {/* Touch-friendly Horizontal Scroller */}
      <div 
        id="horizontal-scroll-bar"
        className="flex gap-3 overflow-x-auto pb-3 pt-1 scrollbar-thin dark:scrollbar-track-gray-950 scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800 -mx-1 px-1 touch-pan-x"
      >
        {hourly.map((hour, index) => (
          <div
            key={index}
            className="flex-shrink-0 w-24 p-3.5 rounded-xl border border-slate-100 dark:border-gray-800/60 text-center flex flex-col items-center justify-between space-y-2 bg-slate-50/20 dark:bg-gray-950/20 hover:border-blue-100 dark:hover:border-indigo-950 hover:bg-slate-50/50 dark:hover:bg-gray-850/10 transition-all/300"
          >
            {/* Time stamp */}
            <span className="block text-[10px] text-gray-400 font-mono tracking-tighter">
              {hour.time}
            </span>

            {/* Icon representation */}
            <div className="my-1.5 flex items-center justify-center">
              {getWeatherIcon(hour.condition, "w-6 h-6")}
            </div>

            {/* Temp */}
            <span className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
              {formatTemp(hour.temp)}
            </span>

            {/* Rain chance probability */}
            <div className="flex items-center gap-0.5" title="Precipitation Probability">
              <Droplet className="w-2.5 h-2.5 text-blue-500" />
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                {hour.precipitationProbability}%
              </span>
            </div>

            {/* Wind velocity */}
            <div className="flex items-center gap-0.5 text-[9px] text-gray-400" title="Wind Velocity">
              <Wind className="w-2.5 h-2.5" />
              <span className="font-mono">
                {formatSpeed(hour.windSpeed)}
              </span>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
