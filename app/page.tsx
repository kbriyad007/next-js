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
  Address: string;
  Description: string;
  Quantity: number;
  Time?: {
    seconds: number;
    nanoseconds: number;
  };
  "Product-Links"?: string[];
};

export default function Home() {
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState<keyof RequestData | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [dateRange, setDateRange] = useState<[string, string]>(["", ""]);
  const [quantityRange, setQuantityRange] = useState<[number, number]>([0, 100]);

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

  const generateInvoice = (req: RequestData) => {
    const invoiceWindow = window.open("", "Invoice", "width=800,height=600");
    const htmlContent = `...`; // Keep your invoice HTML as-is
    invoiceWindow?.document.write(htmlContent);
    invoiceWindow?.document.close();
  };

  const filteredRequests = requests.filter((req) => {
    const query = search.toLowerCase();
    const matchesSearch =
      req["Customer-Name"]?.toLowerCase().includes(query) ||
      req["User-Email"]?.toLowerCase().includes(query) ||
      req.Address?.toLowerCase().includes(query);

    const timestamp = req.Time?.seconds ? new Date(req.Time.seconds * 1000) : null;
    const [startDate, endDate] = dateRange;
    const withinDateRange =
      (!startDate || !timestamp || new Date(startDate) <= timestamp) &&
      (!endDate || !timestamp || new Date(endDate) >= timestamp);

    const withinQuantityRange =
      req.Quantity >= quantityRange[0] && req.Quantity <= quantityRange[1];

    return matchesSearch && withinDateRange && withinQuantityRange;
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
    if (typeof valA === "number" && typeof valB === "number") {
      return sortOrder === "asc" ? valA - valB : valB - valA;
    }
    return 0;
  });

  const renderSortIcon = (key: keyof RequestData) =>
    sortBy === key ? (
      sortOrder === "asc" ? (
        <ArrowUp size={14} className="inline ml-1" />
      ) : (
        <ArrowDown size={14} className="inline ml-1" />
      )
    ) : null;

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
          User Requests
        </h1>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Search by name, email, or address..."
            className="w-full max-w-md px-4 py-2 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange[0]}
                onChange={(e) => setDateRange([e.target.value, dateRange[1]])}
                className="px-3 py-1 rounded border dark:bg-gray-800 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={dateRange[1]}
                onChange={(e) => setDateRange([dateRange[0], e.target.value])}
                className="px-3 py-1 rounded border dark:bg-gray-800 dark:border-gray-600"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Quantity Range: {quantityRange[0]} - {quantityRange[1]}
              </label>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={quantityRange[0]}
                onChange={(e) =>
                  setQuantityRange([parseInt(e.target.value), quantityRange[1]])
                }
              />
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={quantityRange[1]}
                onChange={(e) =>
                  setQuantityRange([quantityRange[0], parseInt(e.target.value)])
                }
              />
            </div>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500 dark:text-gray-400">Loading requests...</p>
        ) : error ? (
          <p className="text-red-500 dark:text-red-400">{error}</p>
        ) : (
          <div className="overflow-auto rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg">
            {/* Keep the rest of your table rendering code as-is */}
          </div>
        )}
      </div>
    </Layout>
  );
}
