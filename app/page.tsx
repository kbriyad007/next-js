"use client";

import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import Layout from "../components/Layout";
import { ArrowDown, ArrowUp, FileText, Phone, Mail, MessageCircle } from "lucide-react";

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
  const [statusMap, setStatusMap] = useState<Record<string, string>>({});

  const minimalColumns = [
    "Customer-Name",
    "Status",
    "User-Email",
    "Phone-Number",
    "Courier",
    "Product-Links",
    "Quantity",
    "Time",
    "Message",
  ];

  const allColumns = [
    ...minimalColumns.slice(0, 5),
    "Address",
    "Description",
    ...minimalColumns.slice(5),
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
        <head><title>Invoice - ${req["Customer-Name"]}</title></head>
        <body>
          <div style="font-family: Arial; padding: 30px; color: #333; max-width: 800px; margin: auto; background: #fff;">
            <h1 style="color: #4CAF50;">ShipMate Invoice</h1>
            <h2>Customer: ${req["Customer-Name"]}</h2>
            <p><strong>Email:</strong> ${req["User-Email"]}</p>
            <p><strong>Phone:</strong> ${req["Phone-Number"] || "N/A"}</p>
            <p><strong>Courier:</strong> ${req.Courier || "N/A"}</p>
            <p><strong>Address:</strong> ${req.Address}</p>
            <p><strong>Quantity:</strong> ${req.Quantity}</p>
            <p><strong>Time:</strong> ${formattedDate}</p>
            <h3>Product Links:</h3>
            ${productLinksHTML}
            <h3>QR Code:</h3>
            <img src="${qrCodeURL}" alt="QR Code" />
          </div>
        </body>
      </html>
    `;
    invoiceWindow?.document.write(htmlContent);
    invoiceWindow?.document.close();

    setStatusMap((prev) => ({
      ...prev,
      [req.id]: "📧 Email Sent",
    }));
  };

  const generateWhatsAppInvoiceLink = (req: RequestData) => {
    const phone = (req["Phone-Number"] || "").replace(/\D/g, "");
    const formattedDate = req.Time?.seconds
      ? new Date(req.Time.seconds * 1000).toLocaleDateString()
      : "N/A";

    const message = `
Hello ${req["Customer-Name"]}, 👋

Here is your order summary:

📦 Courier: ${req.Courier || "N/A"}
🔢 Quantity: ${req.Quantity}
🔗 Product Links:
${(req["Product-Links"] || []).map((link, i) => `${i + 1}. ${link}`).join("\n")}

📅 Date: ${formattedDate}
    `;

    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
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
        <div className="flex justify-between items-center flex-wrap gap-4">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
            🚀 User Requests
          </h1>
          <button
            onClick={() => setShowMinimal((prev) => !prev)}
            className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 rounded-xl text-white transition shadow"
          >
            {showMinimal ? "Switch to Full View" : "Switch to Minimal View"}
          </button>
        </div>

        <input
          type="text"
          placeholder="🔍 Search by name, email, phone, courier..."
          className="w-full max-w-xl px-4 py-2 text-black rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {loading ? (
          <p className="text-white text-center">Loading...</p>
        ) : error ? (
          <p className="text-red-500 text-center">{error}</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-800 shadow-2xl">
            <table className="min-w-full text-sm text-left text-gray-300">
              <thead className="bg-gray-900 text-white uppercase text-xs tracking-wider">
                <tr>
                  {columns.map((key) => (
                    <th
                      key={key}
                      className="px-6 py-4 cursor-pointer hover:text-blue-400 transition select-none"
                      onClick={() => key !== "Message" && key !== "Status" && handleSort(key as keyof RequestData)}
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
                            <a
                              key={i}
                              href={link}
                              target="popup"
                              onClick={(e) => {
                                e.preventDefault();
                                window.open(link, "popup", "width=800,height=600");
                              }}
                              className="block underline hover:text-blue-300"
                            >
                              Link-{i + 1}
                            </a>
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
                            href={generateWhatsAppInvoiceLink(req)}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-green-400 underline hover:text-green-300"
                            onClick={() =>
                              setStatusMap((prev) => ({
                                ...prev,
                                [req.id]: "✅ Sent to WhatsApp",
                              }))
                            }
                          >
                            <MessageCircle size={16} />
                            WhatsApp
                          </a>
                          <button
                            onClick={() => generateInvoice(req)}
                            className="inline-flex items-center gap-1 text-blue-300 underline hover:text-blue-200 text-sm"
                          >
                            <FileText size={16} />
                            Invoice
                          </button>
                        </td>
                      ) : key === "Phone-Number" ? (
                        <td key={key} className="px-6 py-4 text-blue-400 underline">
                          <a
                            href={`tel:${req["Phone-Number"]?.replace(/[^0-9+]/g, "")}`}
                            className="inline-flex items-center gap-1 hover:text-blue-300"
                          >
                            <Phone size={14} />
                            {req["Phone-Number"]}
                          </a>
                        </td>
                      ) : key === "User-Email" ? (
                        <td key={key} className="px-6 py-4 text-blue-400 underline">
                          <a
                            href={`mailto:${req["User-Email"]}`}
                            className="inline-flex items-center gap-1 hover:text-blue-300"
                          >
                            <Mail size={14} />
                            {req["User-Email"]}
                          </a>
                        </td>
                      ) : key === "Status" ? (
                        <td key={key} className="px-6 py-4 text-yellow-300 text-sm">
                          {statusMap[req.id] || "—"}
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

