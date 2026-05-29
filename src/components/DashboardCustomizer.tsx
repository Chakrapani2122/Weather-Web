import { useState } from "react";
import { CustomizableGridConfig } from "../types";
import { Settings2, X } from "lucide-react";

interface DashboardCustomizerProps {
  config: CustomizableGridConfig;
  onUpdate: (newConfig: CustomizableGridConfig) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function DashboardCustomizer({ config, onUpdate, isDarkMode, onToggleDarkMode }: DashboardCustomizerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleWidget = (key: keyof CustomizableGridConfig) => {
    onUpdate({
      ...config,
      [key]: !config[key],
    });
  };

  const widgets: { key: keyof CustomizableGridConfig; label: string }[] = [
    { key: "hourlyForecast", label: "Hourly Forecast" },
    { key: "dailyForecast", label: "7-Day Forecast" },
    { key: "historicalCharts", label: "Historical Charts" },
    { key: "humidityPressure", label: "Humidity & Pressure" },
    { key: "windSystem", label: "Wind Conditions" },
    { key: "sunAndUv", label: "Sun & UV Index" },
    { key: "aiBriefing", label: "Weather Insights" },
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-3 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full shadow-lg transition-colors border border-white/20 z-40 text-white"
        aria-label="Customize Dashboard"
      >
        <Settings2 className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative text-white">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-1 text-white/50 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold mb-6">Dashboard Settings</h2>

            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Dark Mode Override</span>
                <button
                  onClick={onToggleDarkMode}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    isDarkMode ? "bg-blue-500" : "bg-white/20"
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                      isDarkMode ? "translate-x-7" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3">
              Visible Widgets
            </h3>
            <div className="space-y-3">
              {widgets.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm">{label}</span>
                  <button
                    onClick={() => toggleWidget(key)}
                    className={`w-10 h-5 rounded-full transition-colors relative ${
                      config[key] ? "bg-green-500" : "bg-white/20"
                    }`}
                  >
                    <div
                      className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-transform ${
                        config[key] ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="w-full mt-8 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
}
