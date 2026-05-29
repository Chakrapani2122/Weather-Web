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
  Eye,
} from "lucide-react";
import { CurrentWeather, WeatherAlert, UnitSystem } from "../types";

interface DashboardGridProps {
  current: CurrentWeather;
  alerts: WeatherAlert[];
  unitSystem: UnitSystem;
  aiBriefing: string;
  aiPersonalNotes: string;
}

export default function DashboardGrid({
  current,
  alerts,
  unitSystem,
  aiBriefing,
  aiPersonalNotes,
}: DashboardGridProps) {
  const isMetric = unitSystem === "metric";

  const formatSpeed = (ms: number) => {
    if (isMetric) return `${Math.round(ms * 3.6)} km/h`; // m/s to km/h usually looks better
    return `${Math.round(ms * 2.237)} mph`;
  };

  const getUvCategory = (uv: number) => {
    if (uv <= 2) return { text: "Low", color: "bg-green-400" };
    if (uv <= 5) return { text: "Moderate", color: "bg-amber-400" };
    if (uv <= 7) return { text: "High", color: "bg-orange-400" };
    if (uv <= 10) return { text: "Very High", color: "bg-rose-400" };
    return { text: "Extreme", color: "bg-purple-500" };
  };

  const uvCat = getUvCategory(current.uvi);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      
      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="col-span-2 lg:col-span-4 glass-panel p-4 bg-red-900/30 border-red-500/30">
          <div className="flex items-center gap-1.5 text-red-300 mb-2 pb-2 border-b border-red-500/20">
            <ShieldAlert className="w-4 h-4 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Severe Weather Alerts
            </span>
          </div>
          <div className="space-y-3 mt-3">
            {alerts.map((alert) => (
              <div key={alert.id}>
                <span className="block text-sm font-bold text-white">
                  {alert.title}
                </span>
                <span className="block text-xs text-white/80 mt-1">
                  {alert.description}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Briefing */}
      <div className="col-span-2 lg:col-span-4 glass-panel p-4">
        <div className="flex items-center gap-1.5 text-white/70 mb-2 pb-2 border-b border-white/10">
          <BrainCircuit className="w-3.5 h-3.5" />
          <span className="text-[11px] font-semibold uppercase tracking-wider">
            AI Weather Insights
          </span>
        </div>
        <p className="text-sm text-white/90 leading-relaxed mt-2">
          {aiBriefing}
        </p>
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="flex items-center gap-1.5 text-white/60 mb-1">
            <Bookmark className="w-3 h-3" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Advice</span>
          </div>
          <p className="text-xs text-white/80 italic">
            {aiPersonalNotes}
          </p>
        </div>
      </div>

      {/* UV Index */}
      <div className="col-span-1 glass-panel p-4 flex flex-col justify-between aspect-square">
        <div>
          <div className="flex items-center gap-1.5 text-white/70 mb-2">
            <Sun className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">UV Index</span>
          </div>
          <span className="block text-3xl font-light text-white">{current.uvi}</span>
          <span className="block text-lg font-medium text-white">{uvCat.text}</span>
        </div>
        <div className="w-full h-1.5 bg-black/30 rounded-full overflow-hidden mt-4">
          <div className={`h-full rounded-full ${uvCat.color}`} style={{ width: `${Math.min((current.uvi / 11) * 100, 100)}%` }} />
        </div>
      </div>

      {/* Sunrise / Sunset */}
      <div className="col-span-1 glass-panel p-4 flex flex-col justify-between aspect-square">
        <div>
          <div className="flex items-center gap-1.5 text-white/70 mb-2">
            <Sunset className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">Sunset</span>
          </div>
          <span className="block text-2xl font-light text-white mt-1">{current.sunset}</span>
        </div>
        <div className="mt-auto">
          <span className="block text-[11px] text-white/70">Sunrise: {current.sunrise}</span>
        </div>
      </div>

      {/* Wind */}
      <div className="col-span-1 glass-panel p-4 flex flex-col justify-between aspect-square">
        <div>
          <div className="flex items-center gap-1.5 text-white/70 mb-2">
            <Wind className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">Wind</span>
          </div>
          <span className="block text-2xl font-light text-white mt-1">{formatSpeed(current.windSpeed)}</span>
        </div>
        <div className="flex items-center justify-center mt-auto relative w-12 h-12">
          <div className="absolute w-full h-full border border-white/20 rounded-full" />
          <Compass className="w-6 h-6 text-white/80 transition-transform duration-700" style={{ transform: `rotate(${current.windDeg}deg)` }} />
        </div>
      </div>

      {/* Humidity */}
      <div className="col-span-1 glass-panel p-4 flex flex-col justify-between aspect-square">
        <div>
          <div className="flex items-center gap-1.5 text-white/70 mb-2">
            <Droplets className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">Humidity</span>
          </div>
          <span className="block text-3xl font-light text-white mt-1">{current.humidity}%</span>
        </div>
        <div className="mt-auto">
          <span className="block text-[11px] text-white/70">The dew point is {Math.round(current.temp - ((100 - current.humidity) / 5))}° right now.</span>
        </div>
      </div>

      {/* Visibility */}
      <div className="col-span-1 glass-panel p-4 flex flex-col justify-between aspect-square">
        <div>
          <div className="flex items-center gap-1.5 text-white/70 mb-2">
            <Eye className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">Visibility</span>
          </div>
          <span className="block text-3xl font-light text-white mt-1">{parseFloat((current.visibility / 1000).toFixed(1))} km</span>
        </div>
        <div className="mt-auto">
          <span className="block text-[11px] text-white/70">
            {current.visibility >= 10000 ? "It's perfectly clear right now." : "Visibility is slightly reduced."}
          </span>
        </div>
      </div>

      {/* Pressure */}
      <div className="col-span-1 glass-panel p-4 flex flex-col justify-between aspect-square">
        <div>
          <div className="flex items-center gap-1.5 text-white/70 mb-2">
            <Gauge className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">Pressure</span>
          </div>
          <span className="block text-2xl font-light text-white mt-1">{current.pressure}</span>
          <span className="block text-sm text-white/80 font-medium">hPa</span>
        </div>
        <div className="mt-auto">
          <span className="block text-[11px] text-white/70">
            {current.pressure > 1013 ? "High pressure." : "Low pressure."}
          </span>
        </div>
      </div>

    </div>
  );
}
