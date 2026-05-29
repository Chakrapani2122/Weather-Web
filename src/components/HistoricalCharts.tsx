import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { HistoricalClimatology, UnitSystem, WeatherDataPayload } from "../types";
import { Calendar, Layers, Split, Filter } from "lucide-react";

interface HistoricalChartsProps {
  activeCity: string;
  historicalData: HistoricalClimatology[];
  savedCitiesData: Record<string, WeatherDataPayload>;
  unitSystem: UnitSystem;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const CITY_COLORS = [
  { stroke: "#3b82f6", fill: "rgba(59, 130, 246, 0.2)" }, // blue
  { stroke: "#10b981", fill: "rgba(16, 185, 129, 0.2)" }, // emerald
  { stroke: "#f59e0b", fill: "rgba(245, 158, 11, 0.2)" }, // amber
  { stroke: "#8b5cf6", fill: "rgba(139, 92, 246, 0.2)" }, // violet
  { stroke: "#ec4899", fill: "rgba(236, 72, 153, 0.2)" }, // pink
];

export default function HistoricalCharts({
  activeCity,
  historicalData,
  savedCitiesData,
  unitSystem,
}: HistoricalChartsProps) {
  const [activeTab, setActiveTab] = useState<"temperature" | "precipitation" | "humidity">("temperature");
  const [startMonth, setStartMonth] = useState<string>("Jan");
  const [endMonth, setEndMonth] = useState<string>("Dec");
  const [comparedCities, setComparedCities] = useState<string[]>([]);

  const isMetric = unitSystem === "metric";
  const tempUnit = isMetric ? "°C" : "°F";

  const convertTemp = (celsius: number) => {
    if (isMetric) return celsius;
    return Math.round((celsius * 9) / 5 + 32);
  };

  // List comparing candidate cities from cached saved locations matching other than active city
  const comparisonOptions = useMemo(() => {
    return Object.keys(savedCitiesData)
      .map(key => savedCitiesData[key].city)
      .filter(city => city.toLowerCase() !== activeCity.toLowerCase());
  }, [savedCitiesData, activeCity]);

  // Handle month range indexing
  const filteredMonths = useMemo(() => {
    const startIndex = MONTHS.indexOf(startMonth);
    const endIndex = MONTHS.indexOf(endMonth);
    
    if (startIndex <= endIndex) {
      return MONTHS.slice(startIndex, endIndex + 1);
    } else {
      // Loop around or adjust
      return MONTHS.slice(startIndex).concat(MONTHS.slice(0, endIndex + 1));
    }
  }, [startMonth, endMonth]);

  // Build the combined data array for the chart
  const combinedChartData = useMemo(() => {
    return filteredMonths.map((month) => {
      const dataPoint: any = { month };
      
      // 1. Add current active city stats
      const activeMonthData = historicalData.find(h => h.month === month);
      if (activeMonthData) {
        dataPoint[`${activeCity}_Max`] = convertTemp(activeMonthData.avgMaxTemp);
        dataPoint[`${activeCity}_Min`] = convertTemp(activeMonthData.avgMinTemp);
        dataPoint[`${activeCity}_Precip`] = activeMonthData.avgPrecipitation;
        dataPoint[`${activeCity}_Hum`] = activeMonthData.avgHumidity;
      }

      // 2. Add compare cities stats (if cached)
      comparedCities.forEach((compCity) => {
        const cacheKey = compCity.toLowerCase();
        const cityPayload = savedCitiesData[cacheKey];
        if (cityPayload && cityPayload.historical) {
          const compMonthData = cityPayload.historical.find(h => h.month === month);
          if (compMonthData) {
            dataPoint[`${compCity}_Max`] = convertTemp(compMonthData.avgMaxTemp);
            dataPoint[`${compCity}_Min`] = convertTemp(compMonthData.avgMinTemp);
            dataPoint[`${compCity}_Precip`] = compMonthData.avgPrecipitation;
            dataPoint[`${compCity}_Hum`] = compMonthData.avgHumidity;
          }
        }
      });

      return dataPoint;
    });
  }, [filteredMonths, historicalData, activeCity, comparedCities, savedCitiesData, unitSystem]);

  const handleToggleComparison = (city: string) => {
    setComparedCities((prev) =>
      prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]
    );
  };

  return (
    <div id="historical-climate-panel" className="p-5 rounded-2xl border border-slate-205 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm transition-colors duration-300 text-left">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-5 border-b border-gray-100 dark:border-gray-800 pb-4">
        <div>
          <h3 className="font-semibold text-slate-800 dark:text-gray-150 flex items-center gap-2 text-sm md:text-base">
            <Calendar className="w-4 h-4 text-blue-600" /> Climatographical Historical comparison
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Compare monthly precipitation, average temperature thresholds, and seasonal curves across locations
          </p>
        </div>

        {/* Tab triggers */}
        <div className="flex items-center gap-1 p-1 bg-slate-50 dark:bg-gray-800/60 rounded-xl border border-slate-100 dark:border-gray-800">
          <button
            onClick={() => setActiveTab("temperature")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              activeTab === "temperature"
                ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-gray-100 shadow-sm border border-slate-100 dark:border-gray-650"
                : "text-slate-500 dark:text-gray-400 hover:text-slate-700"
            }`}
          >
            Temperature
          </button>
          <button
            onClick={() => setActiveTab("precipitation")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              activeTab === "precipitation"
                ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-gray-100 shadow-sm border border-slate-100 dark:border-gray-650"
                : "text-slate-500 dark:text-gray-400 hover:text-slate-700"
            }`}
          >
            Precipitation
          </button>
          <button
            onClick={() => setActiveTab("humidity")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              activeTab === "humidity"
                ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-gray-100 shadow-sm border border-slate-100 dark:border-gray-650"
                : "text-slate-500 dark:text-gray-400 hover:text-slate-700"
            }`}
          >
            Humidity
          </button>
        </div>
      </div>

      {/* Date filter & Location Compare toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5 p-3.5 bg-slate-50/50 dark:bg-gray-850/30 rounded-xl border border-slate-100 dark:border-gray-800/60 text-xs">
        {/* Dates selective */}
        <div className="space-y-2">
          <span className="font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-widest text-[9px] flex items-center gap-1.5 flex-row">
            <Filter className="w-3.5 h-3.5 text-blue-500" /> Filter Month Duration bounds
          </span>
          <div className="flex items-center gap-2">
            <select
              value={startMonth}
              onChange={(e) => setStartMonth(e.target.value)}
              className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-100 px-2.5 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            >
              {MONTHS.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <span className="text-slate-400 font-semibold">&rarr;</span>
            <select
              value={endMonth}
              onChange={(e) => setEndMonth(e.target.value)}
              className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-100 px-2.5 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            >
              {MONTHS.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Location comparison lists */}
        <div className="space-y-2">
          <span className="font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-widest text-[9px] flex items-center gap-1.5 flex-row">
            <Split className="w-3.5 h-3.5 text-green-500" /> Overlay location comparison
          </span>
          
          {comparisonOptions.length === 0 ? (
            <p className="text-[11px] text-slate-400 italic pt-1">
              Bookmark other cities above to enable overlay comparisons.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2 pt-0.5 max-h-16 overflow-y-auto">
              {comparisonOptions.map((city, idx) => {
                const isSelected = comparedCities.includes(city);
                const color = CITY_COLORS[(idx + 1) % CITY_COLORS.length].stroke;
                return (
                  <button
                    key={city}
                    onClick={() => handleToggleComparison(city)}
                    className={`px-2.5 py-1 rounded-full border transition-all flex items-center gap-1.5 cursor-pointer text-[10px] font-bold ${
                      isSelected
                        ? "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 shadow-sm"
                        : "bg-transparent border-gray-200 dark:border-gray-800 text-slate-400"
                    }`}
                    style={isSelected ? { color } : {}}
                  >
                    <span 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: isSelected ? color : "transparent", border: `1px solid ${isSelected ? "transparent" : "#9ca3af"}` }}
                    />
                    {city}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recharts chart panel */}
      <div id="recharts-historical-canvas" className="w-full h-72 md:h-80 select-none">
        <ResponsiveContainer width="100%" height="100%">
          {activeTab === "temperature" ? (
            <LineChart data={combinedChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-800" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis unit={tempUnit} tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(15, 23, 42, 0.95)",
                  borderColor: "rgba(51, 65, 85, 0.7)",
                  borderRadius: "12px",
                  color: "#f8fafc",
                  fontSize: 12,
                }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              
              {/* Active focal city temp lines */}
              <Line
                type="monotone"
                dataKey={`${activeCity}_Max`}
                name={`${activeCity} Max (${tempUnit})`}
                stroke={CITY_COLORS[0].stroke}
                strokeWidth={3}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey={`${activeCity}_Min`}
                name={`${activeCity} Min (${tempUnit})`}
                stroke={CITY_COLORS[0].stroke}
                strokeDasharray="4 4"
                strokeWidth={1.5}
                dot={false}
              />

              {/* Compare lines */}
              {comparedCities.map((compCity, idx) => {
                const colorObj = CITY_COLORS[(idx + 1) % CITY_COLORS.length];
                return (
                  <Line
                    key={`${compCity}_Max`}
                    type="monotone"
                    dataKey={`${compCity}_Max`}
                    name={`${compCity} Max (${tempUnit})`}
                    stroke={colorObj.stroke}
                    strokeWidth={2.5}
                    dot={{ r: 2 }}
                  />
                );
              })}
              {comparedCities.map((compCity, idx) => {
                const colorObj = CITY_COLORS[(idx + 1) % CITY_COLORS.length];
                return (
                  <Line
                    key={`${compCity}_Min`}
                    type="monotone"
                    dataKey={`${compCity}_Min`}
                    name={`${compCity} Min (${tempUnit})`}
                    stroke={colorObj.stroke}
                    strokeDasharray="3 3"
                    strokeWidth={1.2}
                    dot={false}
                  />
                );
              })}
            </LineChart>
          ) : activeTab === "precipitation" ? (
            <BarChart data={combinedChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-800" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis unit="mm" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(15, 23, 42, 0.95)",
                  borderColor: "rgba(51, 65, 85, 0.7)",
                  borderRadius: "12px",
                  color: "#f8fafc",
                  fontSize: 12,
                }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              
              <Bar
                dataKey={`${activeCity}_Precip`}
                name={`${activeCity} Precip (mm)`}
                fill={CITY_COLORS[0].stroke}
                radius={[4, 4, 0, 0]}
                maxBarSize={25}
              />

              {comparedCities.map((compCity, idx) => {
                const colorObj = CITY_COLORS[(idx + 1) % CITY_COLORS.length];
                return (
                  <Bar
                    key={`${compCity}_Precip`}
                    dataKey={`${compCity}_Precip`}
                    name={`${compCity} Precip (mm)`}
                    fill={colorObj.stroke}
                    radius={[3, 3, 0, 0]}
                    maxBarSize={20}
                  />
                );
              })}
            </BarChart>
          ) : (
            <LineChart data={combinedChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-800" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis unit="%" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(15, 23, 42, 0.95)",
                  borderColor: "rgba(51, 65, 85, 0.7)",
                  borderRadius: "12px",
                  color: "#f8fafc",
                  fontSize: 12,
                }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              
              <Line
                type="monotone"
                dataKey={`${activeCity}_Hum`}
                name={`${activeCity} Humidity (%)`}
                stroke="#06b6d4"
                strokeWidth={3}
                dot={{ r: 3 }}
              />

              {comparedCities.map((compCity, idx) => {
                const colorObj = CITY_COLORS[(idx + 1) % CITY_COLORS.length];
                return (
                  <Line
                    key={`${compCity}_Hum`}
                    type="monotone"
                    dataKey={`${compCity}_Hum`}
                    name={`${compCity} Humidity (%)`}
                    stroke={colorObj.stroke}
                    strokeWidth={2}
                    dot={{ r: 2 }}
                  />
                );
              })}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Insight info */}
      <div className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-gray-805/40 border border-slate-100 dark:border-gray-800/50">
        <div className="h-2 w-2 rounded-full bg-blue-600" />
        <p className="text-[11px] text-gray-500 dark:text-gray-400">
          Showing filtered data from {startMonth} to {endMonth}. Overlay curves illustrate seasonal differentials based on local coordinates.
        </p>
      </div>

    </div>
  );
}
