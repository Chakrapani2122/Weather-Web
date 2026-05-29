import { useState } from "react";
import { Terminal, ShieldAlert, CheckCircle, Database, RefreshCw, Trash2, Sliders } from "lucide-react";
import { DiagnosticLog } from "../types";

interface DiagnosticCenterProps {
  logs: DiagnosticLog[];
  onClearLogs: () => void;
  syncPolicy: "cloud-first" | "local-first" | "merge";
  onSyncPolicyChange: (policy: "cloud-first" | "local-first" | "merge") => void;
  firebaseActive: boolean;
  syncStatus: "synced" | "local-only" | "conflict" | "syncing" | "error";
  onTriggerManualSync: () => void;
}

export default function DiagnosticCenter({
  logs,
  onClearLogs,
  syncPolicy,
  onSyncPolicyChange,
  firebaseActive,
  syncStatus,
  onTriggerManualSync,
}: DiagnosticCenterProps) {
  const [filterSeverity, setFilterSeverity] = useState<"all" | "info" | "warning" | "error">("all");
  const [isOpen, setIsOpen] = useState(false);

  const filteredLogs = logs.filter((log) => {
    if (filterSeverity === "all") return true;
    return log.severity === filterSeverity;
  });

  return (
    <div id="diagnostic-panel-container" className="mt-8 border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-900 shadow-sm overflow-hidden text-left transition-colors duration-300">
      <div 
        id="diagnostic-header-bar"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Terminal className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm md:text-base">
              System Diagnostics & Synchronization Console
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Troubleshoot sync cycles, local conflicts, and meteorological API metrics
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Status Badge */}
          {syncStatus === "synced" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800">
              <CheckCircle className="w-3.5 h-3.5" /> Synced with Cloud
            </span>
          )}
          {syncStatus === "local-only" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800">
              <Database className="w-3.5 h-3.5" /> Local Storage State
            </span>
          )}
          {syncStatus === "conflict" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800 animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5" /> Conflict Detected
            </span>
          )}
          {syncStatus === "syncing" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Syncing...
            </span>
          )}
          {syncStatus === "error" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800">
              <ShieldAlert className="w-3.5 h-3.5" /> Sync Error
            </span>
          )}
          
          <button className="text-gray-400 text-xs px-2 py-1 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            {isOpen ? "Collapse" : "Open Debugger"}
          </button>
        </div>
      </div>

      {isOpen && (
        <div id="diagnostic-body-content" className="p-4 border-t border-gray-100 dark:border-gray-800/80 bg-gray-50/50 dark:bg-transparent">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Sync Policy and Resolution Controls */}
            <div id="diagnostic-policy-column" className="lg:col-span-1 space-y-4">
              <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/60 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  <h4 className="font-semibold text-gray-700 dark:text-gray-200 text-xs uppercase tracking-wider">
                    Conflict Resolution Policy
                  </h4>
                </div>
                
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
                  Configure how conflicts should be handled if cloud stored dashboard states differ from local unauthenticated configurations.
                </p>

                <div className="space-y-2">
                  <label className="flex items-start gap-3 p-2 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="syncPolicy"
                      checked={syncPolicy === "cloud-first"}
                      onChange={() => onSyncPolicyChange("cloud-first")}
                      className="mt-0.5 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="text-left">
                      <span className="block text-xs font-semibold text-gray-700 dark:text-gray-200">
                        Cloud First (Overwrite Local)
                      </span>
                      <span className="block text-[10px] text-gray-400">
                        Prefer central cloud parameters when syncing authenticated clients.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-2 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="syncPolicy"
                      checked={syncPolicy === "local-first"}
                      onChange={() => onSyncPolicyChange("local-first")}
                      className="mt-0.5 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="text-left">
                      <span className="block text-xs font-semibold text-gray-700 dark:text-gray-200">
                        Local First (Overwrite Cloud)
                      </span>
                      <span className="block text-[10px] text-gray-400">
                        Preserve local preferences and upload them dynamically to FireStore.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-2 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="syncPolicy"
                      checked={syncPolicy === "merge"}
                      onChange={() => onSyncPolicyChange("merge")}
                      className="mt-0.5 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="text-left">
                      <span className="block text-xs font-semibold text-gray-700 dark:text-gray-200">
                        Intelligent Merge (Union)
                      </span>
                      <span className="block text-[10px] text-gray-400">
                        Merge city lists, deduplicate, and preserve both.
                      </span>
                    </div>
                  </label>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between gap-2">
                  <button
                    onClick={onTriggerManualSync}
                    disabled={!firebaseActive}
                    className="w-full text-center px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-blue-600 dark:text-blue-400 text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Force Manual Re-sync
                  </button>
                </div>
              </div>

              {/* Offline support notice card */}
              <div className="p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/10 text-xs">
                <span className="block font-medium text-blue-800 dark:text-blue-300">Offline Access Enabled</span>
                <span className="block text-blue-600/80 dark:text-blue-400/80 mt-1 leading-relaxed">
                  The dashboard stores forecast, hourly, alert, and trend configurations directly to standard IndexedDB/LocalStorage. If your network connection drops, cached data remains fully operational and interactive.
                </span>
              </div>
            </div>

            {/* Diagnostic Log Terminals */}
            <div id="diagnostic-log-terminal" className="lg:col-span-2 flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex gap-1.5">
                  {(["all", "info", "warning", "error"] as const).map((sev) => (
                    <button
                      key={sev}
                      onClick={() => setFilterSeverity(sev)}
                      className={`px-3 py-1 text-xs rounded-lg font-medium border capitalize cursor-pointer transition-colors ${
                        filterSeverity === sev
                          ? "bg-gray-800 dark:bg-blue-600 text-white border-transparent"
                          : "bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>

                <button
                  onClick={onClearLogs}
                  className="flex items-center gap-1 py-1 px-2.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 border border-transparent hover:border-red-200 dark:hover:border-red-900 rounded-lg transition-all cursor-pointer"
                  title="Wipe operational logs history"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Wipe Logs
                </button>
              </div>

              {/* Logs terminal box */}
              <div 
                id="diagnostic-logs-window"
                className="flex-1 bg-gray-950 text-gray-300 font-mono text-xs rounded-xl p-4 border border-gray-900 overflow-y-auto max-h-[290px] min-h-[180px] shadow-inner flex flex-col space-y-2 text-left"
              >
                {filteredLogs.length === 0 ? (
                  <p className="text-gray-500 italic text-center py-8">
                    -- No meteorological or database debug cycles recorded in this timeframe --
                  </p>
                ) : (
                  filteredLogs.map((log) => {
                    let sevColor = "text-green-400";
                    if (log.severity === "warning") sevColor = "text-amber-400";
                    if (log.severity === "error") sevColor = "text-red-400";

                    return (
                      <div key={log.id} className="border-b border-gray-900/50 pb-1.5 last:border-0">
                        <div className="flex items-center justify-between text-[10px] text-gray-500 mb-0.5">
                          <span>[{log.timestamp}]</span>
                          <span className="uppercase font-semibold text-blue-400">
                            {log.category}
                          </span>
                        </div>
                        <p className="leading-relaxed">
                          <span className={`font-semibold mr-1.5 ${sevColor}`}>
                            [{log.severity.toUpperCase()}]
                          </span>
                          {log.message}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
