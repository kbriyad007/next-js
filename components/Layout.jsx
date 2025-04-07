"use client";

import { useState, useEffect } from "react";

export default function Layout({ children }) {
  const [darkMode, setDarkMode] = useState(false);

  // 🕰️ Automatically set theme based on time (local to user's device)
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");

    if (storedTheme) {
      setDarkMode(storedTheme === "dark");
    } else {
      const hour = new Date().getHours();
      const isNight = hour < 6 || hour >= 18; // 6 PM to 6 AM is night
      setDarkMode(isNight);
      localStorage.setItem("theme", isNight ? "dark" : "light");
    }
  }, []);

  // 🧠 Apply theme class
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
    <div
      className={`min-h-screen ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
      }`}
    >
      <header className="bg-emerald-600 text-white py-4 shadow-md">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <h1 className="text-2xl font-semibold">User Request Dashboard</h1>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="bg-white text-emerald-600 px-3 py-1 rounded shadow hover:bg-gray-100 transition"
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
