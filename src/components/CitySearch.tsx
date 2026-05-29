import React, { useState, useEffect, useRef } from "react";
import { Search, MapPin, Loader2, Star, Check } from "lucide-react";

interface CitySearchProps {
  onSearch: (city: string) => void;
  savedCities: string[];
  onToggleSaveCity: (city: string) => void;
  activeCity: string;
  isSearching: boolean;
}

const WORLD_CITIES = [
  "New York",
  "London",
  "Singapore",
  "Tokyo",
  "Mumbai",
  "Hyderabad",
  "Cairo",
  "Paris",
  "Sydney",
  "Toronto",
  "Berlin",
  "Rome",
  "Rejkjavik",
  "Oslo",
  "Dubai"
];

export default function CitySearch({
  onSearch,
  savedCities,
  onToggleSaveCity,
  activeCity,
  isSearching,
}: CitySearchProps) {
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredSuggestions = query
    ? WORLD_CITIES.filter((city) =>
        city.toLowerCase().startsWith(query.toLowerCase()) && city.toLowerCase() !== activeCity.toLowerCase()
      )
    : WORLD_CITIES.filter(city => city.toLowerCase() !== activeCity.toLowerCase());

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (city: string) => {
    setQuery("");
    setShowSuggestions(false);
    onSearch(city);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      handleSelect(query.trim());
    }
  };

  const isSaved = savedCities.map(c => c.toLowerCase()).includes(activeCity.toLowerCase());

  return (
    <div id="city-search-container" ref={containerRef} className="relative w-full max-w-lg mx-auto">
      <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            onFocus={() => setShowSuggestions(true)}
            onChange={(e) => setQuery(e.target.value)}
            value={query}
            placeholder="Search city (e.g. London, Paris, Tokyo...)"
            className="w-full pl-11 pr-12 py-3 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl text-sm md:text-base text-slate-800 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/30 dark:focus:border-blue-400 focus:border-blue-500 transition-all outline-none"
          />
          {isSearching && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-blue-600" />
          )}
        </div>

        {/* Dynamic Save City Button next to Search */}
        <button
          type="button"
          onClick={() => onToggleSaveCity(activeCity)}
          className={`px-4 py-3.5 rounded-2xl flex items-center justify-center border text-sm font-medium transition-all duration-300 gap-1.5 cursor-pointer shadow-sm ${
            isSaved
              ? "bg-amber-500 hover:bg-amber-600 border-amber-500 hover:border-amber-600 text-white"
              : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
          }`}
          title={isSaved ? "Remove city from dashboard bookmarks" : "Save city to your custom dashboard bookmarks"}
        >
          {isSaved ? <Check className="w-4 h-4" /> : <Star className="w-4 h-4" />}
          <span className="hidden sm:inline">{isSaved ? "Saved" : "Save"}</span>
        </button>
      </form>

      {/* Autocomplete Suggestions Panel */}
      {showSuggestions && (
        <div id="autocomplete-suggestions-panel" className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl overflow-hidden max-h-60 overflow-y-auto backdrop-blur-md transition-all duration-300">
          <div className="py-2.5">
            <div className="px-4 py-1 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              Suggested Locations
            </div>
            
            {filteredSuggestions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-400 italic">
                Press enter to search &ldquo;{query}&rdquo;
              </div>
            ) : (
              filteredSuggestions.map((city) => (
                <button
                   key={city}
                   type="button"
                   onClick={() => handleSelect(city)}
                   className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  <span className="font-medium">{city}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
