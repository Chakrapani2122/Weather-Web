import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
  darkMode: boolean;
  onThemeToggle: () => void;
}

export default function ThemeToggle({ darkMode, onThemeToggle }: ThemeToggleProps) {
  return (
    <button
      id="theme-toggle-btn"
      onClick={onThemeToggle}
      className="p-2 rounded-xl transition-all duration-300 flex items-center justify-center bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-yellow-400 border border-transparent dark:border-gray-700/50 shadow-sm outline-none cursor-pointer"
      title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      {darkMode ? <Sun className="w-5 h-5 transition-transform hover:rotate-45" /> : <Moon className="w-5 h-5 transition-transform hover:-rotate-12" />}
    </button>
  );
}
