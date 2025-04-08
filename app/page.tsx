"use client";

import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import Layout from "../components/Layout";

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

  const filteredRequests = requests.filter((req) => {
    const query = search.toLowerCase();
    return (
      req["Customer-Name"]?.toLowerCase().includes(query) ||
      req["User-Email"]?.toLowerCase().includes(query) ||
      req.Address?.toLowerCase().includes(query)
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

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          📝 User Requests
        </h1>

        <div className="mb-6">
          <input
            type="text"
            placeholder="🔍 Search name, email, or address..."
            className="w-full md:w-96 px-4 py-2 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <p className="text-gray-500 dark:text-gray-400">Loading requests...</p>
        ) : error ? (
          <p className="text-red-500 dark:text-red-400">{error}</p>
        ) : (
          <div className="overflow-auto rounded-xl shadow-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
              <thead className="sticky top-0 z-10 backdrop-blur bg-white/80 dark:bg-gray-900/80 text-gray-700 dark:text-gray-200">
                <tr>
                  {[
                    { label: "Customer Name", key: "Customer-Name" },
                    { label: "User Email", key: null },
                    { label: "Address", key: null },
                    { label: "Description", key: null },
                    { label: "Product Links", key: null },
                    { label: "Quantity", key: null },
                    { label: "Time", key: null },
                    { label: "Message", key: null },
                  ].map(({ label, key }, idx) => (
                    <th
                      key={idx}
                      onClick={() => key && handleSort(key as keyof RequestData)}
                      className={`px-4 py-3 text-left uppercase font-semibold cursor-${key ? "pointer" : "default"} ${
                        key && sortBy === key ? "text-blue-600 dark:text-blue-400" : ""
                      }`}
                    >
                      {label} {sortBy === key ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-900 dark:text-gray-100">
                {sortedRequests.map((req, idx) => (
                  <tr
                    key={req.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                  >
                    <td className="px-4 py-3">{req["Customer-Name"]}</td>
                    <td className="px-4 py-3">{req["User-Email"]}</td>
                    <td className="px-4 py-3 whitespace-pre-wrap">{req.Address}</td>
                    <td className="px-4 py-3 whitespace-pre-wrap">{req.Description}</td>
                    <td className="px-4 py-3">
                      {req["Product-Links"]?.length ? (
                        <div className="flex flex-col space-y-1">
                          {req["Product-Links"].map((link, i) => (
                            <a
                              key={i}
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline transition"
                            >
                              Link {i + 1}
                            </a>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">No Links</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{req.Quantity}</td>
                    <td className="px-4 py-3">
                      {req.Time?.seconds
                        ? new Date(req.Time.seconds * 1000).toLocaleString()
                        : "N/A"}
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`https://wa.me/?text=Hello%20${encodeURIComponent(
                          req["Customer-Name"]
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          fill="currentColor"
                          viewBox="0 0 448 512"
                        >
                          <path d="M380.9 97.1C339 55.3...z" />
                        </svg>
                        <span>Chat</span>
                      </a>
                    </td>
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
