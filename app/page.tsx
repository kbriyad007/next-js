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
    "Product-Links",
    "Quantity",
    "Time",
    "Message",
  ];

  const allColumns = [
    "Customer-Name",
    "User-Email",
    "Phone-Number",
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

  const productLinksHTML = req["Product-Links"]?.map(
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
        <style>
          body {
            font-family: 'Inter', 'Segoe UI', sans-serif;
            margin: 0;
            padding: 0;
            background: #f0f2f5;
            color: #1f2937;
          }
          .invoice-container {
            max-width: 800px;
            margin: 40px auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
            padding: 40px;
          }
          .brand {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 24px;
          }
          .brand h1 {
            font-size: 24px;
            font-weight: 700;
            color: #2563eb;
            margin: 0;
          }
          .brand .date {
            font-size: 14px;
            color: #6b7280;
          }
          .section {
            margin-bottom: 24px;
          }
          .section h2 {
            font-size: 16px;
            margin-bottom: 8px;
            color: #111827;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 4px;
          }
          .section p {
            margin: 4px 0;
            font-size: 14px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
            font-size: 14px;
          }
          th, td {
            padding: 12px;
            border: 1px solid #e5e7eb;
          }
          th {
            background-color: #f9fafb;
            text-align: left;
            color: #374151;
          }
          td {
            color: #1f2937;
          }
          .product-links {
            margin-top: 12px;
          }
          .product-links a {
            color: #2563eb;
            text-decoration: none;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 13px;
            color: #6b7280;
          }
          @media print {
            .invoice-container {
              box-shadow: none;
              margin: 0;
              border-radius: 0;
              padding: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="brand">
            <h1>MyCompany Invoice</h1>
            <div class="date">${formattedDate}</div>
          </div>

          <div class="section">
            <h2>Customer Details</h2>
            <p><strong>Name:</strong> ${req["Customer-Name"]}</p>
            <p><strong>Email:</strong> ${req["User-Email"]}</p>
            <p><strong>Phone:</strong> ${req["Phone-Number"] || "N/A"}</p>
            <p><strong>Address:</strong> ${req.Address}</p>
          </div>

          <div class="section">
            <h2>Order Summary</h2>
            <table>
              <tr>
                <th>Description</th>
                <th>Quantity</th>
              </tr>
              <tr>
                <td>${req.Description}</td>
                <td>${req.Quantity}</td>
              </tr>
            </table>

            <div class="product-links">
              <p><strong>Product Links:</strong><br>${productLinksHTML}</p>
            </div>
          </div>

          <div class="footer">
            <p>Thank you for your request.</p>
            <p>This invoice was generated electronically and is valid without a signature.</p>
          </div>
        </div>
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
      req["Phone-Number"]?.toLowerCase().includes(query)
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
      sortOrder === "asc" ? (
        <ArrowUp size={14} className="inline ml-1" />
      ) : (
        <ArrowDown size={14} className="inline ml-1" />
      )
    ) : null;

  const columns = showMinimal ? minimalColumns : allColumns;

  return (
    <Layout>
      <div className="p-6 space-y-6 max-w-screen-2xl mx-auto">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
            User Requests
          </h1>
          <button
            onClick={() => setShowMinimal((prev) => !prev)}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 transition"
          >
            {showMinimal ? "Full View" : "Minimal View"}
          </button>
        </div>

        <input
          type="text"
          placeholder="Search by name, email, address, or phone..."
          className="w-full max-w-md px-4 py-2 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {loading ? (
          <p className="text-gray-500 dark:text-gray-400">Loading requests...</p>
        ) : error ? (
          <p className="text-red-500 dark:text-red-400">{error}</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
              <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-800 text-white">
                <tr>
                  {columns.map((key) => (
                    <th
                      key={key}
                      className={`px-4 py-3 text-left font-semibold uppercase ${
                        key === "Address" || key === "Description" ? "w-64" : ""
                      } ${key !== "Message" ? "cursor-pointer" : ""}`}
                      onClick={() =>
                        key !== "Message" && handleSort(key as keyof RequestData)
                      }
                    >
                      {key.replace(/-/g, " ")}
                      {renderSortIcon(key as keyof RequestData)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {sortedRequests.map((req) => (
                  <tr
                    key={req.id}
                    className="even:bg-gray-50 hover:bg-gray-100 dark:even:bg-gray-800 dark:hover:bg-gray-700 transition"
                  >
                    {columns.map((key) =>
                      key === "Product-Links" ? (
                        <td key={key} className="px-4 py-3 text-blue-600 dark:text-blue-400">
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
                      ) : key === "Time" ? (
                        <td key={key} className="px-4 py-3 text-gray-800 dark:text-gray-200">
                          {req.Time?.seconds
                            ? new Date(req.Time.seconds * 1000).toLocaleString()
                            : "N/A"}
                        </td>
                      ) : key === "Message" ? (
                        <td key={key} className="px-4 py-3 flex flex-col gap-1">
                          <a
                            href={`https://wa.me/${req["Phone-Number"]?.replace(
                              /[^0-9]/g,
                              ""
                            )}?text=${encodeURIComponent(
                              `Hello ${req["Customer-Name"]}, I received your request.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                          >
                            WhatsApp
                          </a>
                          <button
                            onClick={() => generateInvoice(req)}
                            className="flex items-center gap-1 px-3 py-1 text-sm font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-800 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-700 transition"
                          >
                            <FileText size={16} />
                            Invoice
                          </button>
                        </td>
                      ) : (
                        <td key={key} className="px-4 py-3 text-gray-800 dark:text-gray-200">
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


