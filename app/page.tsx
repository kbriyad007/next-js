"use client";

import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import Layout from "../components/Layout";

import { Slider } from "@/components/ui/slider";
import { format } from "date-fns";
import { ArrowDown, ArrowUp } from "lucide-react";

import Datepicker from "react-tailwindcss-datepicker";

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

  const [quantityFilter, setQuantityFilter] = useState<number>(0);
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });

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
    const matchesSearch =
      req["Customer-Name"]?.toLowerCase().includes(query) ||
      req["User-Email"]?.toLowerCase().includes(query) ||
      req.Address?.toLowerCase().includes(query);

    const matchesQuantity = req.Quantity >= quantityFilter;

    const requestDate = req.Time?.seconds
      ? new Date(req.Time.seconds * 1000)
      : null;

    const matchesDate =
      !dateRange.startDate ||
      !requestDate ||
      (requestDate >= new Date(dateRange.startDate) &&
        requestDate <= new Date(dateRange.endDate));

    return matchesSearch && matchesQuantity && matchesDate;
  });

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
          User Requests
        </h1>

        <input
          type="text"
          placeholder="Search by name, email, or address..."
          className="w-full max-w-md px-4 py-2 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-1/2">
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Date Range
            </label>
            <Datepicker
              value={dateRange}
              onChange={setDateRange}
              showShortcuts={true}
              primaryColor="blue"
              useRange={false}
              displayFormat="DD/MM/YYYY"
              containerClassName="relative"
              inputClassName="w-full rounded-xl border border-gray-300 dark:border-gray-600 px-4 py-2 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="w-full md:w-1/2">
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Minimum Quantity: {quantityFilter}
            </label>
            <Slider
              defaultValue={[0]}
              max={100}
              step={1}
              value={[quantityFilter]}
              onValueChange={(val) => setQuantityFilter(val[0])}
            />
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500 dark:text-gray-400">Loading requests...</p>
        ) : error ? (
          <p className="text-red-500 dark:text-red-400">{error}</p>
        ) : (
          <div className="overflow-auto rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
              <thead className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 text-white">
                <tr>
                  {[
                    "Customer-Name",
                    "User-Email",
                    "Address",
                    "Description",
                    "Product-Links",
                    "Quantity",
                    "Time",
                  ].map((key) => (
                    <th
                      key={key}
                      className={`px-4 py-3 text-left font-semibold uppercase ${
                        key === "Address" || key === "Description" ? "w-64" : ""
                      }`}
                    >
                      {key.replace(/-/g, " ")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredRequests.map((req) => (
                  <tr
                    key={req.id}
                    className="even:bg-gray-50 hover:bg-gray-100 dark:even:bg-gray-800 dark:hover:bg-gray-700 transition"
                  >
                    <td className="px-4 py-3 text-gray-800 dark:text-gray-200">
                      {req["Customer-Name"]}
                    </td>
                    <td className="px-4 py-3 text-gray-800 dark:text-gray-200">
                      {req["User-Email"]}
                    </td>
                    <td className="px-4 py-3 whitespace-normal w-64 text-gray-800 dark:text-gray-200">
                      {req.Address}
                    </td>
                    <td className="px-4 py-3 whitespace-normal w-64 text-gray-800 dark:text-gray-200">
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
