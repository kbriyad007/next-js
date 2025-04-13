"use client";

import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import Layout from "../components/Layout";

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

  return (
    <Layout>
      <div className="p-6 space-y-6 max-w-screen-2xl mx-auto text-white">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-semibold">User Requests</h1>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 text-sm bg-green-600 rounded-xl hover:bg-green-700"
          >
            📋 View Customer Table
          </button>
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

        {/* 🔍 Search */}
        <input
          type="text"
          placeholder="Search..."
          className="w-full max-w-md px-4 py-2 border rounded-xl text-black"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Modal Popup */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
            <div className="bg-white text-black w-full max-w-4xl rounded-lg shadow-lg p-6 relative overflow-auto max-h-[90vh]">
              <h2 className="text-xl font-bold mb-4">Customer Info Table</h2>
              <button
                className="absolute top-3 right-4 text-gray-600 hover:text-black"
                onClick={() => setShowModal(false)}
              >
                ❌
              </button>
              <table className="min-w-full text-sm text-left border border-gray-300">
                <thead className="bg-gray-100 font-semibold text-gray-700">
                  <tr>
                    <th className="px-4 py-3 border">Customer Name</th>
                    <th className="px-4 py-3 border">User Email</th>
                    <th className="px-4 py-3 border">Phone Number</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((req) => (
                    <tr key={req.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2 border">{req["Customer-Name"]}</td>
                      <td className="px-4 py-2 border">{req["User-Email"]}</td>
                      <td className="px-4 py-2 border">{req["Phone-Number"] || "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

// 📊 Widget Component
function DashboardWidget({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="bg-gray-900 p-5 rounded-xl shadow-md border border-gray-800">
      <h3 className="text-sm text-gray-400 mb-2">{title}</h3>
      <p className="text-3xl font-semibold">{value}</p>
    </div>
  );
}
