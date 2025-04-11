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
  Courier?: string; // ✅ Added Courier field
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
  const [showMinimal, setShowMinimal] = useState(false);

  const minimalColumns = [
    "Customer-Name",
    "User-Email",
    "Phone-Number",
    "Courier", // ✅ Added Courier to minimal
    "Product-Links",
    "Quantity",
    "Time",
    "Message",
  ];

  const allColumns = [
    "Customer-Name",
    "User-Email",
    "Phone-Number",
    "Courier", // ✅ Added Courier to full columns
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

  const generateInvoice = (req: RequestData) => {
    const invoiceWindow = window.open("", "Invoice", "width=900,height=700");

    const productLinksHTML =
      req["Product-Links"]?.map(
        (link, i) =>
          `<a href="${link}" target="_blank">🔗 Link ${i + 1}</a><br>`
      ).join("") || "N/A";

    const formattedDate = req.Time?.seconds
      ? new Date(req.Time.seconds * 1000).toLocaleString()
      : "N/A";

    const htmlContent = `
      <html>
        <head>
          <title>Invoice - ${req["Customer-Name"]}</title>
          <style>body { font-family: sans-serif; }</style>
        </head>
        <body>
          <h1>Invoice</h1>
          <p><strong>Name:</strong> ${req["Customer-Name"]}</p>
          <p><strong>Email:</strong> ${req["User-Email"]}</p>
          <p><strong>Phone:</strong> ${req["Phone-Number"] || "N/A"}</p>
          <p><strong>Courier:</strong> ${req.Courier || "N/A"}</p>
          <p><strong>Address:</strong> ${req.Address}</p>
          <p><strong>Description:</strong> ${req.Description}</p>
          <p><strong>Quantity:</strong> ${req.Quantity}</p>
          <p><strong>Time:</strong> ${formattedDate}</p>
          <div><strong>Product Links:</strong><br>${productLinksHTML}</div>
          <script>window.print();</script>
        </body>
      </html>
    `;

    invoiceWindow?.document.write(htmlContent);
    invoiceWindow?.document.close();
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

        <input
          type="text"
          placeholder="Search..."
          className="w-full max-w-md px-4 py-2 border rounded-xl text-black"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border">
            <table className="min-w-full divide-y text-sm">
              <thead className="bg-gray-800 text-white uppercase text-xs font-semibold">
                <tr>
                  {columns.map((key) => (
                    <th
                      key={key}
                      className="px-4 py-3 cursor-pointer"
                      onClick={() => key !== "Message" && handleSort(key as keyof RequestData)}
                    >
                      {key.replace(/-/g, " ")}
                      {renderSortIcon(key as keyof RequestData)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {sortedRequests.map((req) => (
                  <tr key={req.id}>
                    {columns.map((key) =>
                      key === "Product-Links" ? (
                        <td key={key} className="px-4 py-3 text-blue-500">
                          {(req["Product-Links"] ?? []).map((link, i) => (
                            <div key={i}>
                              <a
                                href={link}
                                target="popup"
                                onClick={(e) => {
                                  e.preventDefault();
                                  window.open(link, "popup", "width=800,height=600");
                                }}
                                className="underline"
                              >
                                Link-{i + 1}
                              </a>
                            </div>
                          ))}
                        </td>
                      ) : key === "Time" ? (
                        <td key={key} className="px-4 py-3">
                          {req.Time?.seconds
                            ? new Date(req.Time.seconds * 1000).toLocaleString()
                            : "N/A"}
                        </td>
                      ) : key === "Message" ? (
                        <td key={key} className="px-4 py-3 space-y-1">
                          <a
                            href={`https://wa.me/${req["Phone-Number"]?.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hello ${req["Customer-Name"]}, I received your request.`)}`}
                            target="_blank"
                            className="text-green-400 underline block"
                          >
                            WhatsApp
                          </a>
                          <button
                            onClick={() => generateInvoice(req)}
                            className="text-blue-300 underline text-sm"
                          >
                            <FileText size={16} className="inline" /> Invoice
                          </button>
                        </td>
                      ) : (
                        <td key={key} className="px-4 py-3">
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
