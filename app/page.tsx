"use client";

import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import Layout from "../components/Layout";
import { ArrowDown, ArrowUp, FileText } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

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

  const minimalColumns = [
    "Customer-Name",
    "User-Email",
    "Phone-Number",
    "Courier",
    "Product-Links",
    "Quantity",
    "Time",
    "Message",
  ];

  const allColumns = [
    "Customer-Name",
    "User-Email",
    "Phone-Number",
    "Courier",
    "Address",
    "Description",
    "Product-Links",
    "Quantity",
    "Time",
    "Message",
  ];

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

  const getValue = (req: RequestData, key: string): string => {
    const value = (req as Record<string, unknown>)[key];
    return typeof value === "string" || typeof value === "number" ? String(value) : "N/A";
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

  const renderSortIcon = (key: keyof RequestData) =>
    sortBy === key ? (
      sortOrder === "asc" ? <ArrowUp size={14} className="inline ml-1" /> : <ArrowDown size={14} className="inline ml-1" />
    ) : null;

  const columns = showMinimal ? minimalColumns : allColumns;

  const courierChartData = Object.entries(
    requests.reduce((acc, r) => {
      const courier = r.Courier || "Unspecified";
      acc[courier] = (acc[courier] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([courier, count]) => ({
    courier,
    count,
  }));

  return (
    <Layout>
      <div className="p-6 space-y-6 max-w-screen-2xl mx-auto text-white">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-semibold">User Requests</h1>
          <button
            onClick={() => setShowMinimal((prev) => !prev)}
            className="px-4 py-2 text-sm bg-blue-600 rounded-xl"
          >
            {showMinimal ? "Full View" : "Minimal View"}
          </button>
        </div>

        {/* Dashboard widgets */}
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

        {/* Analytics chart */}
        <div className="bg-gray-900 p-6 rounded-xl shadow-md border border-gray-800">
          <h2 className="text-xl font-semibold text-white mb-4">Courier Analytics</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={courierChartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="courier" stroke="#ccc" />
              <YAxis stroke="#ccc" />
              <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none", color: "#fff" }} />
              <Bar dataKey="count" fill="#60a5fa" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search..."
          className="w-full max-w-md px-4 py-2 border rounded-xl text-black"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Data table */}
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-700 shadow-lg">
            <table className="min-w-full text-sm text-left text-gray-200">
              <thead className="bg-gray-900 text-white uppercase text-xs tracking-wider">
                <tr>
                  {columns.map((key) => (
                    <th
                      key={key}
                      className="px-6 py-4 cursor-pointer select-none hover:text-blue-400 transition-colors"
                      onClick={() => key !== "Message" && handleSort(key as keyof RequestData)}
                    >
                      <div className="flex items-center gap-1">
                        {key.replace(/-/g, " ")}
                        {renderSortIcon(key as keyof RequestData)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 bg-gray-950">
                {sortedRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-800 transition-colors duration-150">
                    {columns.map((key) =>
                      key === "Product-Links" ? (
                        <td key={key} className="px-6 py-4 text-blue-400">
                          {(req["Product-Links"] ?? []).map((link, i) => (
                            <div key={i}>
                              <a
                                href={link}
                                target="popup"
                                onClick={(e) => {
                                  e.preventDefault();
                                  window.open(link, "popup", "width=800,height=600");
                                }}
                                className="underline hover:text-blue-300 transition"
                              >
                                Link-{i + 1}
                              </a>
                            </div>
                          ))}
                        </td>
                      ) : key === "Time" ? (
                        <td key={key} className="px-6 py-4">
                          {req.Time?.seconds
                            ? new Date(req.Time.seconds * 1000).toLocaleString()
                            : "N/A"}
                        </td>
                      ) : key === "Message" ? (
                        <td key={key} className="px-6 py-4 space-y-1">
                          <a
                            href={`https://wa.me/${req["Phone-Number"]?.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hello ${req["Customer-Name"]}, I received your request.`)}`}
                            target="_blank"
                            className="text-green-400 underline block hover:text-green-300"
                          >
                            WhatsApp
                          </a>
                          <button
                            onClick={() => generateInvoice(req)}
                            className="text-blue-300 underline text-sm hover:text-blue-200"
                          >
                            <FileText size={16} className="inline mr-1" />
                            Invoice
                          </button>
                        </td>
                      ) : key === "Phone-Number" ? (
                        <td key={key} className="px-6 py-4 text-blue-400 underline">
                          <a
                            href={`tel:${req["Phone-Number"]?.replace(/[^0-9+]/g, "")}`}
                            className="hover:text-blue-300"
                          >
                            {req["Phone-Number"]}
                          </a>
                        </td>
                      ) : key === "User-Email" ? (
                        <td key={key} className="px-6 py-4 text-blue-400 underline">
                          <a
                            href={`mailto:${req["User-Email"]}`}
                            className="hover:text-blue-300"
                          >
                            {req["User-Email"]}
                          </a>
                        </td>
                      ) : (
                        <td key={key} className="px-6 py-4">
                          {getValue(req, key)}
                        </td>
                      )
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}

function DashboardWidget({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="bg-gray-900 p-5 rounded-xl shadow-md border border-gray-800">
      <h3 className="text-sm text-gray-400 mb-2">{title}</h3>
      <p className="text-3xl font-semibold">{value}</p>
    </div>
  );
}



