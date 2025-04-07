"use client";

import { useState, useEffect } from "react";

export default function Layout({ children }) {
  const [darkMode, setDarkMode] = useState(false);

  // Load preference on mount
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme === "dark") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  // Watch for dark mode changes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-gray-100 transition-colors duration-300">
      <header className="bg-emerald-600 text-white py-4 shadow-md">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <h1 className="text-2xl font-semibold">User Request Dashboard</h1>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="bg-white text-emerald-600 px-3 py-1 rounded shadow hover:bg-gray-100 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 transition"
          >
            {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>

      <footer className="bg-white dark:bg-gray-800 border-t mt-8 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
        &copy; {new Date().getFullYear()} Your Company Name. All rights reserved.
      </footer>
    </div>
  );
}
