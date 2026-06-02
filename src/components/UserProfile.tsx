import { useState } from "react";
import { X, MapPin, Trash2, Plus, User } from "lucide-react";
import { UserDashboardPreferences } from "../types";

interface UserProfileProps {
  user: UserDashboardPreferences | null;
  onClose: () => void;
  onAddCity: (city: string) => void;
  onRemoveCity: (city: string) => void;
  onSelectCity: (city: string) => void;
  activeCity: string;
}

export default function UserProfile({
  user,
  onClose,
  onAddCity,
  onRemoveCity,
  onSelectCity,
  activeCity,
}: UserProfileProps) {
  const [newCity, setNewCity] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAddCity = async () => {
    if (!newCity.trim()) return;
    
    setIsAdding(true);
    try {
      await onAddCity(newCity.trim());
      setNewCity("");
    } catch (err) {
      console.error("Failed to add city:", err);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {user?.displayName || "Guest User"}
              </h2>
              <p className="text-sm text-white/60">{user?.email || "Local Mode"}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/50 hover:text-white transition-colors rounded-full hover:bg-white/10"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Add New Location */}
            <div>
              <h3 className="text-sm font-bold text-white/70 uppercase tracking-wider mb-3">
                Add New Location
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter city name..."
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddCity()}
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
                <button
                  onClick={handleAddCity}
                  disabled={!newCity.trim() || isAdding}
                  className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-white/10 disabled:cursor-not-allowed rounded-xl text-white font-semibold transition-colors flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add
                </button>
              </div>
            </div>

            {/* Saved Locations */}
            <div>
              <h3 className="text-sm font-bold text-white/70 uppercase tracking-wider mb-3">
                Saved Locations ({user?.savedCities.length || 0})
              </h3>
              
              {user?.savedCities && user.savedCities.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {user.savedCities.map((city) => (
                    <div
                      key={city}
                      className={`group relative p-4 rounded-xl border transition-all cursor-pointer ${
                        activeCity.toLowerCase() === city.toLowerCase()
                          ? "bg-blue-500/20 border-blue-500/50"
                          : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                      }`}
                      onClick={() => {
                        onSelectCity(city);
                        onClose();
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            activeCity.toLowerCase() === city.toLowerCase()
                              ? "bg-blue-500/30"
                              : "bg-white/10"
                          }`}>
                            <MapPin className={`w-5 h-5 ${
                              activeCity.toLowerCase() === city.toLowerCase()
                                ? "text-blue-300"
                                : "text-white/60"
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-white font-semibold truncate">{city}</h4>
                            <p className="text-xs text-white/50">
                              {activeCity.toLowerCase() === city.toLowerCase() ? "Active" : "Click to switch"}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveCity(city);
                          }}
                          className="p-2 text-white/40 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 hover:bg-red-500/10 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MapPin className="w-12 h-12 text-white/20 mx-auto mb-3" />
                  <p className="text-white/60">No saved locations yet</p>
                  <p className="text-sm text-white/40 mt-1">Add your favorite cities above</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
