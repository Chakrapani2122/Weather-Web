import {
  Wind,
  Compass,
  Droplets,
  Gauge,
  Sunset,
  Sun,
  ShieldAlert,
  BrainCircuit,
  Bookmark,
} from "lucide-react";
import { CurrentWeather, WeatherAlert, CustomizableGridConfig, UnitSystem } from "../types";

interface DashboardGridProps {
  current: CurrentWeather;
  alerts: WeatherAlert[];
  gridConfig: CustomizableGridConfig;
  unitSystem: UnitSystem;
  aiBriefing: string;
  aiPersonalNotes: string;
}

export default function DashboardGrid({
  current,
  alerts,
  gridConfig,
  unitSystem,
  aiBriefing,
  aiPersonalNotes,
}: DashboardGridProps) {
  const isMetric = unitSystem === "metric";
  const speedUnit = isMetric ? "m/s" : "mph";

  const formatSpeed = (ms: number) => {
    if (isMetric) return `${ms} m/s`;
    return `${Math.round(ms * 2.237)} mph`;
  };

  const getUvCategory = (uv: number) => {
    if (uv <= 2) return { text: "Low", color: "text-green-500", bg: "bg-green-500" };
    if (uv <= 5) return { text: "Moderate", color: "text-amber-500", bg: "bg-amber-500" };
    if (uv <= 7) return { text: "High", color: "text-orange-500", bg: "bg-orange-500" };
    if (uv <= 10) return { text: "Very High", color: "text-rose-500", bg: "bg-rose-500" };
    return { text: "Extreme", color: "text-purple-600", bg: "bg-purple-600" };
  };

  const uvCat = getUvCategory(current.uvi);

  return (
    <div id="dashboard-grid-widgets" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      
      {/* 1. Real-time Hazard Alerts Column */}
      {gridConfig.realTimeAlerts && alerts.length > 0 && (
        <div id="grid-widget-alerts" className="col-span-1 md:col-span-2 lg:col-span-4 p-5 rounded-2xl border border-red-100 dark:border-red-950/40 bg-gradient-to-r from-red-50 to-amber-50 dark:from-red-950/20 dark:to-amber-950/10 text-left relative overflow-hidden transition-all duration-300">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-5 text-red-500">
            <ShieldAlert className="w-40 h-40" />
          </div>
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400">
              <ShieldAlert className="w-5 h-5 animate-bounce" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-red-800 dark:text-red-300 uppercase tracking-widest">
                  Live Meteorological Hazard Alert
                </h4>
                <span className="animate-pulse h-2 w-2 rounded-full bg-red-500" />
              </div>
              <div className="mt-3 space-y-3">
                {alerts.map((alert) => (
                  <div key={alert.id} className="border-l-2 border-red-400 dark:border-red-600 pl-3">
                    <span className="block text-xs font-semibold text-gray-800 dark:text-gray-200">
                      {alert.title} — ({alert.source})
                    </span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1 pb-1">
                      {alert.description}
                    </span>
                    <span className="block text-[10px] text-gray-400 font-mono">
                      Validity: active and expires at {alert.expires}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Generative Artificial Weather Intelligence Summary */}
      {gridConfig.aiBriefing && (
        <div id="grid-widget-insights" className="col-span-1 md:col-span-2 p-5 rounded-2xl border border-blue-100/60 dark:border-blue-950/30 bg-gradient-to-br from-blue-50/70 to-slate-50/30 dark:from-indigo-950/10 dark:to-cyan-950/5 text-left relative overflow-hidden transition-all duration-300 shadow-sm">
          <div className="absolute right-0 top-0 translate-x-5 -translate-y-5 opacity-5 text-blue-600">
            <BrainCircuit className="w-32 h-32" />
          </div>
          <div className="flex gap-3 items-start">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-indigo-950/40 text-blue-600 dark:text-blue-400">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <span className="block text-[10px] font-bold text-blue-600 tracking-wider uppercase mb-1">
                Gemini Climate Insight
              </span>
              <h4 className="font-semibold text-slate-850 dark:text-gray-100 text-sm md:text-base leading-snug">
                Personalized AI Briefing
              </h4>
              <p className="text-xs text-slate-700 dark:text-gray-300 mt-3 leading-relaxed">
                {aiBriefing}
              </p>
              
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-indigo-950/50">
                <span className="block text-[10px] font-bold text-slate-400 tracking-wide uppercase mb-1 flex items-center gap-1.5 flex-row">
                  <Bookmark className="w-3 h-3 text-blue-500" /> Wear & Activity Note
                </span>
                <p className="text-xs text-slate-550 dark:text-gray-400 italic leading-relaxed">
                  {aiPersonalNotes}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Wind Velocity & Directional Compass Widget */}
      {gridConfig.windSystem && (
        <div id="grid-widget-wind" className="p-5 rounded-2xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm text-left flex flex-col justify-between transition-colors duration-300">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                Wind System
              </span>
              <Wind className="w-4 h-4 text-slate-400" />
            </div>
            <div className="flex items-center gap-4">
              {/* Compass Gauge */}
              <div 
                className="relative w-14 h-14 rounded-full border border-slate-200 dark:border-gray-800 flex items-center justify-center bg-slate-55 dark:bg-gray-950 transition-transform shadow-inner"
                title={`Wind heading degrees: ${current.windDeg}°`}
              >
                <div 
                  className="w-full h-full absolute transition-transform duration-700" 
                  style={{ transform: `rotate(${current.windDeg}deg)` }}
                >
                  <Compass className="w-10 h-10 mx-auto mt-2 text-blue-600 dark:text-indigo-400" />
                </div>
                <span className="text-[10px] text-slate-500 font-bold z-10 font-mono">
                  {current.windDeg}°
                </span>
              </div>
              <div className="flex-1">
                <span className="block text-2xl font-bold font-mono tracking-tight text-gray-800 dark:text-gray-100">
                  {formatSpeed(current.windSpeed)}
                </span>
                <span className="block text-xs text-gray-400 mt-1">
                  Absolute velocity track
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-50 dark:border-gray-850/40">
            <span className="text-[10px] text-gray-400 leading-normal">
              Continuous vector headings indicating standard air streams relative to the poles.
            </span>
          </div>
        </div>
      )}

      {/* 4. Climatology Humidity & Pressure Dial */}
      {gridConfig.humidityPressure && (
        <div id="grid-widget-humidity" className="p-5 rounded-2xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm text-left flex flex-col justify-between transition-colors duration-300">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                Air Humidity
              </span>
              <Droplets className="w-4 h-4 text-blue-500" />
            </div>
            
            <div className="flex items-end justify-between">
              <div>
                <span className="block text-2xl font-bold font-mono tracking-tight text-slate-800 dark:text-gray-100 font-mono">
                  {current.humidity}%
                </span>
                <span className="block text-xs text-slate-400 mt-1">
                  Relative ambient moisture
                </span>
              </div>
              <div className="w-16 h-2 bg-slate-100 dark:bg-gray-800 rounded-full overflow-hidden mb-1.5 shadow-inner">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${current.humidity}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-gray-850/40 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-semibold text-slate-750 dark:text-gray-300 font-mono">
                {current.pressure} hPa
              </span>
            </div>
            <span className="text-[10px] text-slate-400">Pressure</span>
          </div>
        </div>
      )}

      {/* 5. Sunrise, Sunset and UV Index Indicator */}
      {gridConfig.sunAndUv && (
        <div id="grid-widget-uv" className="p-5 rounded-2xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm text-left flex flex-col justify-between transition-colors duration-300">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                UV Solar Index
              </span>
              <Sun className="w-4 h-4 text-amber-500" />
            </div>

            <div className="flex items-end justify-between">
              <div>
                <span className="block text-2xl font-bold font-mono tracking-tight text-slate-800 dark:text-gray-100 font-mono">
                  {current.uvi}
                </span>
                <span className={`block text-xs font-semibold mt-1 ${uvCat.color}`}>
                  {uvCat.text} Risk
                </span>
              </div>
              {/* Soft UV scale indicator dots */}
              <div className="flex gap-0.5 pb-2.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-2.5 w-1.5 rounded-full transition-all duration-300 ${
                      i < Math.min(5, Math.ceil(current.uvi / 2.2))
                        ? uvCat.bg
                        : "bg-slate-100 dark:bg-gray-805/80"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-gray-850/40 flex justify-between items-center text-xs">
            <div className="flex items-center gap-1 text-slate-600 dark:text-gray-350">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-mono text-[10px]">{current.sunrise}</span>
            </div>
            <div className="flex items-center gap-1 text-slate-600 dark:text-gray-350">
              <Sunset className="w-3.5 h-3.5 text-orange-400" />
              <span className="font-mono text-[10px]">{current.sunset}</span>
            </div>
          </div>
        </div>
      )}

      {/* 6. Visibility Index widget */}
      {gridConfig.humidityPressure && (
        <div id="grid-widget-visibility" className="p-5 rounded-2xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm text-left flex flex-col justify-between transition-colors duration-300">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                Sight Visibility
              </span>
              <Sun className="w-4 h-4 text-slate-400" />
            </div>

            <span className="block text-2xl font-bold font-mono tracking-tight text-slate-800 dark:text-gray-100 font-mono">
              {parseFloat((current.visibility / 1000).toFixed(1))} km
            </span>
            <span className="block text-xs text-slate-400 mt-1">
              Ambient visual clearance index
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-gray-850/40">
            <span className="text-[10px] text-slate-400 leading-relaxed">
              {current.visibility >= 10000 ? "Excellent sight ranges." : "Sight range mildly reduced due to cloud vapors."}
            </span>
          </div>
        </div>
      )}

    </div>
  );
}
