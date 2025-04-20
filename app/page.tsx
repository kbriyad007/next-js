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
  const [sortBy, setSortBy] = useState<keyof RequestData | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showMinimal, setShowMinimal] = useState(false);

  const minimalColumns = [
    "Customer-Name",
    "User-Email",
    "Phone-Number",
    "Courier",
    "Quantity",
    "Time",
  ];

  const allColumns = [
    "Customer-Name",
    "User-Email",
    "Phone-Number",
    "Courier",
    "Address",
    "Description",
    "Quantity",
    "Time",
    "Product-Links",
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
    return value ? String(value) : "N/A";
  };

  const filteredRequests = requests.filter((req) => {
    const searchTerm = search.toLowerCase();
    return (
      req["Customer-Name"]?.toLowerCase().includes(searchTerm) ||
      req["User-Email"]?.toLowerCase().includes(searchTerm) ||
      req["Phone-Number"]?.toLowerCase().includes(searchTerm) ||
      req["Courier"]?.toLowerCase().includes(searchTerm) ||
      req["Product-Links"]?.some((link) =>
        link.toLowerCase().includes(searchTerm)
      )
    );
  });

  const sortedRequests = filteredRequests.sort((a, b) => {
    if (!sortBy) return 0;

    const aValue = a[sortBy];
    const bValue = b[sortBy];

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortOrder === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
    }
    return 0;
  });

  return (
    <Layout>
      <div className="min-h-screen p-6">
        <h1 className="text-3xl font-semibold mb-4">Customer Requests</h1>
        <div className="mb-4 flex items-center">
          <input
            type="text"
            placeholder="Search for requests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="p-2 border rounded-md w-full max-w-xs mr-4"
          />
          <button
            onClick={() => setShowMinimal(!showMinimal)}
            className="p-2 px-4 bg-blue-600 text-white rounded-md"
          >
            {showMinimal ? "Show Full View" : "Show Minimal View"}
          </button>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-200 text-gray-600">
                {allColumns.map((column) => (
                  <th
                    key={column}
                    className="py-2 px-4 cursor-pointer text-left"
                    onClick={() => handleSort(column as keyof RequestData)}
                  >
                    {column}
                    {sortBy === column && (
                      <span>
                        {sortOrder === "asc" ? " 🔼" : " 🔽"}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedRequests.map((req) => (
                <tr key={req.id} className="border-b">
                  {showMinimal
                    ? minimalColumns.map((col) => (
                        <td key={col} className="py-2 px-4">
                          {getValue(req, col)}
                        </td>
                      ))
                    : allColumns.map((col) => (
                        <td key={col} className="py-2 px-4">
                          {getValue(req, col)}
                        </td>
                      ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}
