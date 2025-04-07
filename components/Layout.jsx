// components/Layout.jsx
"use client";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <header className="bg-emerald-600 text-white py-4 shadow-md">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-2xl font-semibold">User Request Dashboard</h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
      <footer className="bg-white border-t mt-8 py-4 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} Your Company Name. All rights
        reserved.
      </footer>
    </div>
  );
}
