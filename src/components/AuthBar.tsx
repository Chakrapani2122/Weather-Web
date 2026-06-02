import { LogIn, LogOut, Cloud, UserCircle } from "lucide-react";
import { UserDashboardPreferences } from "../types";

interface AuthBarProps {
  user: UserDashboardPreferences | null;
  onSignIn: () => void;
  onSignOut: () => void;
  syncStatus: "synced" | "local-only" | "conflict" | "syncing" | "error";
  onTriggerManualSync: () => void;
  onOpenProfile: () => void;
}

export default function AuthBar({
  user,
  onSignIn,
  onSignOut,
  syncStatus,
  onOpenProfile,
}: AuthBarProps) {
  const isGuest = !user || user.uid === "local-user";

  return (
    <div className="flex items-center justify-between w-full px-4 py-3">
      <div className="flex items-center gap-2 text-white/80">
        <Cloud className="w-5 h-5" />
        <span className="text-xs font-medium opacity-80">
          {syncStatus === "synced"
            ? "Weather Sync"
            : syncStatus === "local-only"
            ? "Local Mode"
            : "Syncing..."}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Profile Button */}
        <button
          onClick={onOpenProfile}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-md text-white text-xs font-semibold border border-white/20"
        >
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt="Avatar"
              className="w-5 h-5 rounded-full border border-white/30"
            />
          ) : (
            <UserCircle className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">Profile</span>
        </button>

        {isGuest ? (
          <button
            onClick={onSignIn}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-md text-white text-xs font-semibold cursor-pointer border border-white/20"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        ) : (
          <button
            onClick={onSignOut}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-md text-white text-xs font-semibold cursor-pointer border border-white/20"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        )}
      </div>
    </div>
  );
}
