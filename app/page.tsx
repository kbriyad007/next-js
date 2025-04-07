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

  useEffect(() => {
    const fetchData = async () => {
      const querySnapshot = await getDocs(collection(db, "user_request"));
      const data: RequestData[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as RequestData[];
      setRequests(data);
    };

    fetchData();
  }, []);

  const filteredRequests = requests.filter((req) => {
    const query = search.toLowerCase();
    return (
      req["Customer-Name"]?.toLowerCase().includes(query) ||
      req["User-Email"]?.toLowerCase().includes(query) ||
      req.Address?.toLowerCase().includes(query)
    );
  });

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
          User Requests
        </h1>

        {/* 🔍 Search Box */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by name, email, or address..."
            className="w-full md:w-96 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-800 dark:text-white transition-all shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto bg-white dark:bg-gray-900 shadow-md rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
            <thead className="bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-700 dark:to-indigo-800 text-white">
              <tr>
                <th className="px-4 py-3 text-left font-semibold uppercase">
                  Customer Name
                </th>
                <th className="px-4 py-3 text-left font-semibold uppercase">
                  User Email
                </th>
                <th className="px-4 py-3 text-left font-semibold uppercase w-64">
                  Address
                </th>
                <th className="px-4 py-3 text-left font-semibold uppercase w-64">
                  Description
                </th>
                <th className="px-4 py-3 text-left font-semibold uppercase">
                  Product Links
                </th>
                <th className="px-4 py-3 text-left font-semibold uppercase">
                  Quantity
                </th>
                <th className="px-4 py-3 text-left font-semibold uppercase">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
              {filteredRequests.map((req, idx) => (
                <tr
                  key={req.id}
                  className={
                    idx % 2 === 0
                      ? "bg-white dark:bg-gray-900"
                      : "bg-gray-50 dark:bg-gray-800"
                  }
                >
                  <td className="px-4 py-3 text-gray-800 dark:text-gray-200 whitespace-nowrap">
                    {req["Customer-Name"]}
                  </td>
                  <td className="px-4 py-3 text-gray-800 dark:text-gray-200 whitespace-nowrap">
                    {req["User-Email"]}
                  </td>
                  <td className="px-4 py-3 text-gray-800 dark:text-gray-200 whitespace-normal w-64">
                    {req.Address}
                  </td>
                  <td className="px-4 py-3 text-gray-800 dark:text-gray-200 whitespace-normal w-64">
                    {req.Description}
                  </td>
                  <td className="px-4 py-3 text-blue-600 dark:text-blue-400 whitespace-nowrap">
                    {Array.isArray(req["Product-Links"]) &&
                    req["Product-Links"].length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {req["Product-Links"].map((link, i) => (
                          <a
                            key={i}
                            href={link}
                            target="popup"
                            onClick={(e) => {
                              e.preventDefault();
                              window.open(
                                link,
                                "popup",
                                "width=800,height=600"
                              );
                            }}
                            className="text-blue-500 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300"
                          >
                            Link-{i + 1}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500">
                        No Links
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-800 dark:text-gray-200 whitespace-nowrap">
                    {req.Quantity}
                  </td>
                  <td className="px-4 py-3 text-gray-800 dark:text-gray-200 whitespace-nowrap">
                    {req.Time?.seconds
                      ? new Date(req.Time.seconds * 1000).toLocaleString()
                      : "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
