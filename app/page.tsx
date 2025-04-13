"use client";

import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import Layout from "../components/Layout";
import { ArrowDown, ArrowUp, FileText } from "lucide-react";

type RequestData = {
  id: string;
  "Customer-Name": string;
  "User-Email": string;
  "Phone-Number"?: string;
  Address: string;
  Description: string;
  Courier?: string;
  Quantity: number;
  Time?: { seconds: number; nanoseconds: number };
  "Product-Links"?: string[];
};

export default function Home() {
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState<keyof RequestData | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showMinimal, setShowMinimal] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "user_request"));
        const data: RequestData[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as RequestData[];
        setRequests(data);
      } catch {
        setError("Failed to fetch data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSort = (key: keyof RequestData) => {
    setSortOrder(sortBy === key && sortOrder === "asc" ? "desc" : "asc");
    setSortBy(key);
  };

  // 🔧 Stub for Invoice button
  const generateInvoice = (req: RequestData) => {
    alert(`Invoice feature not implemented yet.\nCustomer: ${req["Customer-Name"]}`);
  };

  const filteredRequests = requests.filter((req) => {
    const query = search.toLowerCase();
    return (
      req["Customer-Name"]?.toLowerCase().includes(query) ||
      req["User-Email"]?.toLowerCase().includes(query) ||
      req.Address?.toLowerCase().includes(query) ||
      req["Phone-Number"]?.toLowerCase().includes(query) ||
      req.Courier?.toLowerCase().includes(query)
    );
  });

  const sortedRequests = [...filteredRequests].sort((a, b) => {
    if (!sortBy) return 0;
    const valA = a[sortBy];
    const valB = b[sortBy];
    if (typeof valA === "string" && typeof valB === "string") {
      return sortOrder === "asc"
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    }
    return 0;
  });

  const getValue = (req: RequestData, key: string): string => {
    const value = (req as Record<string, unknown>)[key];
    return typeof value === "string" || typeof value === "number" ? String(value) : "N/A";
  };

  const renderSortIcon = (key: keyof RequestData) =>
    sortBy === key ? (
      sortOrder === "asc" ? <ArrowUp size={14} className="inline ml-1" /> : <ArrowDown size={14} className="inline ml-1" />
    ) : null;

  return (
    <Layout>
      <div className="p-6 space-y-6 max-w-screen-2xl mx-auto text-white">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-semibold">User Requests</h1>
          <div className="flex gap-4">
            <button
              onClick={() => setShowMinimal((prev) => !prev)}
              className="px-4 py-2 text-sm bg-blue-600 rounded-xl"
            >
              {showMinimal ? "Full View" : "Minimal View"}
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 text-sm bg-green-600 rounded-xl"
            >
              📋 View Contact Table
            </button>
          </div>
        </div>

        {/* 🚀 Analytics Widgets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-white">
          <DashboardWidget title="Total Requests" value={requests.length} />
          <DashboardWidget
            title="Unique Users"
            value={new Set(requests.map((r) => r["User-Email"])).size}
          />
          <DashboardWidget
            title="Total Quantity"
            value={requests.reduce((sum, r) => sum + Number(r.Quantity || 0), 0)}
          />
          <DashboardWidget
            title="Top Courier"
            value={
              Object.entries(
                requests.reduce((acc, r) => {
                  const courier = r.Courier || "Unspecified";
                  acc[courier] = (acc[courier] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              )
                .sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A"
            }
          />
        </div>

        <input
          type="text"
          placeholder="Search..."
          className="w-full max-w-md px-4 py-2 border rounded-xl text-black"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* 🔥 Table Section */}
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-700 shadow-lg">
            <table className="min-w-full text-sm text-left text-gray-200">
              <thead className="bg-gray-900 text-white uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-4">Customer Name</th>
                  <th className="px-6 py-4">User Email</th>
                  <th className="px-6 py-4">Phone Number</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 bg-gray-950">
                {sortedRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-800 transition-colors">
                    <td className="px-6 py-4">{req["Customer-Name"]}</td>
                    <td className="px-6 py-4">{req["User-Email"]}</td>
                    <td className="px-6 py-4">{req["Phone-Number"]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 📦 Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
            <div className="bg-white text-black p-6 rounded-lg shadow-lg w-full max-w-3xl">
              <h2 className="text-xl font-bold mb-4">📞 Customer Contact Info</h2>
              <table className="min-w-full border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 border">Customer Name</th>
                    <th className="p-2 border">User Email</th>
                    <th className="p-2 border">Phone Number</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr key={req.id} className="even:bg-gray-50">
                      <td className="p-2 border">{req["Customer-Name"]}</td>
                      <td className="p-2 border">{req["User-Email"]}</td>
                      <td className="p-2 border">{req["Phone-Number"]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="text-right mt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

// 🧠 Widget Component
function DashboardWidget({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="bg-gray-900 p-5 rounded-xl shadow-md border border-gray-800">
      <h3 className="text-sm text-gray-400 mb-2">{title}</h3>
      <p className="text-3xl font-semibold">{value}</p>
    </div>
  );
}

