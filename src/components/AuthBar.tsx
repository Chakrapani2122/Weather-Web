import { LogIn, LogOut, CloudLightning, RefreshCw, AlertCircle, Database, LayoutDashboard } from "lucide-react";
import { UserDashboardPreferences } from "../types";
import { isFirebaseLive } from "../firebase";

interface AuthBarProps {
  user: UserDashboardPreferences | null;
  onSignIn: () => void;
  onSignOut: () => void;
  syncStatus: "synced" | "local-only" | "conflict" | "syncing" | "error";
  onTriggerManualSync: () => void;
}

export default function AuthBar({
  user,
  onSignIn,
  onSignOut,
  syncStatus,
  onTriggerManualSync,
}: AuthBarProps) {
  return (
    <header id="app-auth-navigation-header" className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-6 border-b border-slate-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl shadow-sm transition-colors duration-300">
      
      {/* Brand Logo & Name */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/10">
          <CloudLightning className="w-5 h-5" />
        </div>
        <div className="text-left">
          <span className="text-base font-bold text-slate-800 dark:text-gray-100 flex items-center gap-1.5 tracking-tight font-sans">
            Skyline Weather Station
          </span>
          <span className="block text-[10px] uppercase font-bold tracking-widest text-blue-600 dark:text-blue-400 mt-0.5">
            Full-Stack Weather Intelligence
          </span>
        </div>
      </div>

      {/* Auth segment / Local indicator */}
      <div className="flex items-center gap-3.5">
        
        {/* Connection Mode Feedback */}
        {!isFirebaseLive ? (
          <div 
            id="offline-banner-alert"
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-blue-100 dark:border-blue-950/40 bg-blue-50 text-[11px]"
            title="Vite Hot-Reload simulation: client elements saved to local browser sandbox."
          >
            <Database className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-blue-700 dark:text-blue-400 font-semibold text-xs">Local Sandbox Mode</span>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-2">
            {/* Sync trigger button */}
            <button
              onClick={onTriggerManualSync}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-gray-800 hover:bg-slate-55 dark:hover:bg-gray-800 text-slate-500 hover:text-slate-700 dark:hover:text-gray-300/90 cursor-pointer transition-colors"
              title="Force sync dashboard config to FireStore Database"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === "syncing" ? "animate-spin text-blue-500" : ""}`} />
            </button>
          </div>
        )}

        {user ? (
          /* Logged In */
          <div id="auth-signed-in-segment" className="flex items-center gap-3">
            <div className="text-right">
              <span className="block text-xs font-semibold text-slate-800 dark:text-gray-100 max-w-[120px] truncate">
                {user.displayName || user.email.split("@")[0]}
              </span>
              <span className="block text-[9px] text-slate-400 font-mono tracking-tighter">
                {user.email}
              </span>
            </div>

            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt="Profile picture"
                referrerPolicy="no-referrer"
                className="w-8.5 h-8.5 rounded-full border border-slate-200 dark:border-blue-500 shadow-inner"
              />
            ) : (
              <div className="w-8.5 h-8.5 rounded-full border border-slate-200 dark:border-blue-500 flex items-center justify-center bg-blue-50 dark:bg-indigo-950 text-blue-600 font-bold text-xs uppercase shadow-inner">
                {user.email[0]}
              </div>
            )}

            <button
              onClick={onSignOut}
              className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 border border-transparent hover:border-red-100 dark:hover:border-red-900 transition-colors cursor-pointer"
              title="Sign out of Google weather cloud sync"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        ) : (
          /* Logged Out / Prompt sign in */
          <div id="auth-signed-out-segment" className="flex items-center gap-2">
            {!isFirebaseLive && (
              <span className="text-[10px] text-slate-400 hidden lg:inline border-r border-slate-200 dark:border-gray-800 pr-3.5">
                Saved preferences preserved locally on this device.
              </span>
            )}
            
            <button
              onClick={onSignIn}
              disabled={!isFirebaseLive}
              className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-semibold transition-all duration-300 shadow-sm cursor-pointer ${
                isFirebaseLive
                  ? "bg-blue-600 hover:bg-blue-700 text-white border-transparent"
                  : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
              }`}
              title={isFirebaseLive ? "Synchronize dashboard settings using Google Account" : "Firebase setup is pending to enable Google Authentication"}
            >
              <LogIn className="w-4 h-4" />
              <span>
                {isFirebaseLive ? "Sign in with Google" : "Google Login Unavailable"}
              </span>
            </button>
          </div>
        )}

      </div>

    </header>
  );
}
