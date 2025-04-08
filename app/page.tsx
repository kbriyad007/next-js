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
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          User Requests
        </h1>

        {/* Search */}
        <div>
          <input
            type="text"
            placeholder="Search by name, email, or address..."
            className="w-full md:w-96 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white shadow-sm transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <p className="text-gray-500 dark:text-gray-400">Loading requests...</p>
        ) : error ? (
          <p className="text-red-500 dark:text-red-400">{error}</p>
        ) : (
          <div className="overflow-x-auto bg-white dark:bg-gray-900 shadow-xl rounded-2xl border border-gray-200 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
              <thead className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 text-white">
                <tr>
                  <th
                    onClick={() => handleSort("Customer-Name")}
                    className="cursor-pointer px-4 py-3 text-left font-semibold uppercase"
                  >
                    Customer Name{" "}
                    {sortBy === "Customer-Name" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                  </th>
                  <th className="px-4 py-3 text-left font-semibold uppercase">User Email</th>
                  <th className="px-4 py-3 text-left font-semibold uppercase w-64">Address</th>
                  <th className="px-4 py-3 text-left font-semibold uppercase w-64">Description</th>
                  <th className="px-4 py-3 text-left font-semibold uppercase">Product Links</th>
                  <th className="px-4 py-3 text-left font-semibold uppercase">Quantity</th>
                  <th className="px-4 py-3 text-left font-semibold uppercase">Time</th>
                  <th className="px-4 py-3 text-left font-semibold uppercase">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {sortedRequests.map((req) => (
                  <tr
                    key={req.id}
                    className="even:bg-gray-50 dark:even:bg-gray-800"
                  >
                    <td className="px-4 py-3 text-gray-800 dark:text-gray-200">
                      {req["Customer-Name"]}
                    </td>
                    <td className="px-4 py-3 text-gray-800 dark:text-gray-200">
                      {req["User-Email"]}
                    </td>
                    <td className="px-4 py-3 text-gray-800 dark:text-gray-200 whitespace-normal w-64">
                      {req.Address}
                    </td>
                    <td className="px-4 py-3 text-gray-800 dark:text-gray-200 whitespace-normal w-64">
                      {req.Description}
                    </td>
                    <td className="px-4 py-3 text-blue-600 dark:text-blue-400">
                      {Array.isArray(req["Product-Links"]) && req["Product-Links"].length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {req["Product-Links"].map((link, i) => (
                            <a
                              key={i}
                              href={link}
                              target="popup"
                              onClick={(e) => {
                                e.preventDefault();
                                window.open(link, "popup", "width=800,height=600");
                              }}
                              className="underline hover:text-blue-800 dark:hover:text-blue-300"
                            >
                              Link-{i + 1}
                            </a>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">No Links</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{req.Quantity}</td>
                    <td className="px-4 py-3 text-gray-800 dark:text-gray-200">
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
                        className="inline-flex items-center text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="30"
                          height="30"
                          fill="currentColor"
                          viewBox="0 0 448 512"
                        >
                          <path d="M380.9 97.1C339 55.3 283.2 32 224.8 32c-125.3 0-227 101.7-227 227 0 40.1 10.5 79.3 30.3 113.7L4.5 480l112.6-29.4c32.7 17.9 69.6 27.4 107.8 27.4h.1c125.3 0 227-101.7 227-227 0-59.9-23.4-116.2-64.1-157.9zM224.8 438.3c-32.6 0-64.7-8.7-92.7-25.2l-6.6-3.9-66.8 17.5 17.9-65-4.3-6.8c-18.6-29.6-28.4-63.8-28.4-98.7 0-104.1 84.7-188.8 188.8-188.8 50.4 0 97.7 19.6 133.3 55.2s55.2 82.9 55.2 133.3c0 104.1-84.7 188.9-188.9 188.9zm101.5-138.7c-5.5-2.8-32.5-16-37.6-17.8-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 17.8-17.6 21.5-3.2 3.7-6.5 4.2-12 1.4-32.5-16.3-53.8-29.1-75.2-66.3-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2s-9.7 1.4-14.8 6.9c-5.1 5.6-19.3 18.9-19.3 46s19.8 53.3 22.6 57c2.8 3.7 38.9 59.3 94.3 83.2 13.2 5.7 23.5 9.1 31.6 11.6 13.3 4.2 25.4 3.6 35 2.2 10.7-1.6 32.5-13.3 37.1-26.2 4.6-13 4.6-24.2 3.2-26.2-1.3-2.1-5-3.4-10.5-6.2z" />
                        </svg>
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
