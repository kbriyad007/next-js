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

  const generateInvoice = (req: RequestData) => {
    const invoiceWindow = window.open("", "Invoice", "width=900,height=700");
    const productLinks = req["Product-Links"] ?? [];
    const productLinksText = productLinks.map((link, i) => `Link ${i + 1}: ${link}`).join(" | ");
    const qrText = `
      Name: ${req["Customer-Name"]}
      Email: ${req["User-Email"]}
      Courier: ${req.Courier || "N/A"}
      Quantity: ${req.Quantity}
      Product(s): ${productLinksText || "N/A"}
    `;
    const qrCodeURL = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
      qrText
    )}&size=150x150`;

    const productLinksHTML =
      productLinks.length > 0
        ? productLinks
            .map(
              (link, i) =>
                `<div style="margin-bottom: 5px;">
                  🔗 <a href="${link}" target="_blank">Product Link ${i + 1}</a>
                </div>`
            )
            .join("")
        : "N/A";

    const formattedDate = req.Time?.seconds
      ? new Date(req.Time.seconds * 1000).toLocaleString()
      : "N/A";

    const htmlContent = `
      <html>
        <head>
          <title>Invoice - ${req["Customer-Name"]}</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background-color: #f7f9fc;
              padding: 40px;
              color: #333;
            }
            .invoice-box {
              max-width: 800px;
              margin: auto;
              background: white;
              padding: 30px;
              border: 1px solid #eee;
              border-radius: 12px;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 30px;
            }
            .header h1 {
              font-size: 28px;
              color: #2c3e50;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              color: #3498db;
            }
            .section {
              margin-bottom: 20px;
            }
            .section h3 {
              margin-bottom: 10px;
              color: #555;
              border-bottom: 1px solid #ddd;
              padding-bottom: 5px;
            }
            .row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
            }
            .row label {
              font-weight: bold;
              color: #444;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #aaa;
              font-size: 12px;
            }
            a {
              color: #2980b9;
              text-decoration: none;
            }
            a:hover {
              text-decoration: underline;
            }
            .qr {
              text-align: center;
              margin-top: 30px;
            }
            .qr img {
              border: 1px solid #ddd;
              padding: 6px;
              border-radius: 10px;
            }
          </style>
        </head>
        <body>
          <div class="invoice-box">
            <div class="header">
              <div class="logo">📦 ShipMate</div>
              <h1>Invoice</h1>
            </div>
            <div class="section">
              <h3>Customer Information</h3>
              <div class="row"><label>Name:</label> ${req["Customer-Name"]}</div>
              <div class="row"><label>Email:</label> ${req["User-Email"]}</div>
              <div class="row"><label>Phone:</label> ${req["Phone-Number"] || "N/A"}</div>
              <div class="row"><label>Address:</label> ${req.Address}</div>
            </div>
            <div class="section">
              <h3>Order Details</h3>
              <div class="row"><label>Courier:</label> ${req.Courier || "N/A"}</div>
              <div class="row"><label>Description:</label> ${req.Description}</div>
              <div class="row"><label>Quantity:</label> ${req.Quantity}</div>
              <div class="row"><label>Submitted At:</label> ${formattedDate}</div>
            </div>
            <div class="section">
              <h3>Product Links</h3>
              ${productLinksHTML}
            </div>
            <div class="qr">
              <h3>📦 Order Summary QR</h3>
              <img src="${qrCodeURL}" alt="QR Code for Order Summary" />
              <p>Scan to view order details</p>
            </div>
            <div class="footer">
              ✅ Thank you for your request. We’ll be in touch shortly.<br />
              <em>Generated by ShipMate Portal</em>
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


