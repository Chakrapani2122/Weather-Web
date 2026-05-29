import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { HistoricalClimatology, UnitSystem } from "../types";
import { BarChart3, TrendingUp } from "lucide-react";

interface HistoricalChartsProps {
  data: HistoricalClimatology[];
  unitSystem: UnitSystem;
}

export default function HistoricalCharts({ data, unitSystem }: HistoricalChartsProps) {
  const [activeTab, setActiveTab] = useState<"temp" | "precip">("temp");
  const isMetric = unitSystem === "metric";

  const chartData = data.map((d) => ({
    name: d.month,
    maxTemp: isMetric ? Math.round(d.avgMaxTemp) : Math.round((d.avgMaxTemp * 9) / 5 + 32),
    minTemp: isMetric ? Math.round(d.avgMinTemp) : Math.round((d.avgMinTemp * 9) / 5 + 32),
    precip: d.avgPrecipitation,
  }));

  return (
    <div className="glass-panel p-4 flex flex-col h-80">
      <div className="flex items-center justify-between text-white/70 mb-4 border-b border-white/10 pb-2">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5" />
          <span className="text-[11px] font-semibold uppercase tracking-wider">
            Historical Data
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("temp")}
            className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded transition-colors ${
              activeTab === "temp" ? "bg-white/20 text-white" : "hover:bg-white/10"
            }`}
          >
            Temp
          </button>
          <button
            onClick={() => setActiveTab("precip")}
            className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded transition-colors ${
              activeTab === "precip" ? "bg-white/20 text-white" : "hover:bg-white/10"
            }`}
          >
            Precip
          </button>
        </div>
      </div>

      <div className="flex-1 w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          {activeTab === "temp" ? (
            <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMax" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorMin" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(255,255,255,0.5)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                itemStyle={{ color: "#fff" }}
              />
              <Area type="monotone" dataKey="maxTemp" stroke="#ef4444" fillOpacity={1} fill="url(#colorMax)" name="High" />
              <Area type="monotone" dataKey="minTemp" stroke="#3b82f6" fillOpacity={1} fill="url(#colorMin)" name="Low" />
            </AreaChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(255,255,255,0.5)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                itemStyle={{ color: "#fff" }}
              />
              <Bar dataKey="precip" fill="#60a5fa" radius={[4, 4, 0, 0]} name="Precipitation (mm)" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
