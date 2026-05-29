import React, { useState, useRef, useEffect } from "react";
import { Search, MapPin, X } from "lucide-react";

interface CitySearchProps {
  onSearch: (city: string) => void;
  savedCities: string[];
  onToggleSaveCity: (city: string) => void;
  activeCity: string;
  isSearching: boolean;
}

export default function CitySearch({
  onSearch,
  savedCities,
  activeCity,
  isSearching,
}: CitySearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      onSearch(q);
      setIsOpen(false);
      setQuery("");
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-sm mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center w-full">
          <Search className="absolute left-3 w-4 h-4 text-white/50" />
          <input
            type="text"
            placeholder="Search for a city or airport"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            className="w-full pl-9 pr-10 py-2 bg-black/20 backdrop-blur-md border border-white/10 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-white/30 text-sm transition-all"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2 p-1 text-white/50 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      {isOpen && (query.length > 0 || savedCities.length > 0) && (
        <div className="absolute top-full mt-2 w-full bg-black/40 backdrop-blur-2xl border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50">
          <div className="max-h-64 overflow-y-auto no-scrollbar">
            {savedCities.length > 0 && !query && (
              <div className="py-2">
                <div className="px-4 py-1 text-[10px] font-semibold text-white/50 uppercase tracking-wider">
                  Saved Locations
                </div>
                {savedCities.map((city) => (
                  <button
                    key={city}
                    onClick={() => {
                      onSearch(city);
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-white/10 text-left text-sm text-white transition-colors"
                  >
                    <MapPin className="w-4 h-4 text-white/70" />
                    <span>{city}</span>
                  </button>
                ))}
              </div>
            )}
            {query && (
              <button
                onClick={() => {
                  onSearch(query);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 text-left text-sm text-white transition-colors border-t border-white/10"
              >
                <Search className="w-4 h-4 text-white/70" />
                <span>Search for "{query}"</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
