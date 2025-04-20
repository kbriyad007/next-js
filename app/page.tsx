"use client";

import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import Layout from "../components/Layout";
import { ArrowDown, ArrowUp } from "lucide-react"; // Removed unused import

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
    "Customer-Name",
    "Status",
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

  const generateWhatsAppInvoiceLink = (req: RequestData) => {
    const phone = (req["Phone-Number"] || "").replace(/\D/g, "");
    const formattedDate = req.Time?.seconds
      ? new Date(req.Time.seconds * 1000).toLocaleDateString()
      : "N/A";

    const message = `
Hello ${req["Customer-Name"] || "Customer"}, 👋

Here is your order summary:

🧾 Invoice ID: ${req.id}
📦 Courier: ${req.Courier || "N/A"}
🔢 Quantity: ${req.Quantity || "N/A"}
🔗 Product Links:
${(req["Product-Links"] || []).map((link, i) => `${i + 1}. ${link}`).join("\n")}

📅 Order Date: ${formattedDate}

Thank you for your order! 🙏
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
      sortOrder === "asc" ? <ArrowUp size={12} className="inline ml-1" /> : <ArrowDown size={12} className="inline ml-1" />
    ) : null;

  const columns = showMinimal ? minimalColumns : allColumns;

  return (
    <Layout>
      <div className="p-6 flex flex-col items-center space-y-4">
        <input
          className="p-2 rounded-md border border-gray-300"
          type="text"
          placeholder="Search for orders"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="space-x-4">
          <button className="p-2 border border-gray-300 rounded-md" onClick={() => setShowMinimal(!showMinimal)}>
            Toggle View
          </button>
        </div>

        <table className="table-auto w-full text-sm text-left">
          <thead>
            <tr className="text-gray-700">
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort(col as keyof RequestData)}
                >
                  {col} {renderSortIcon(col as keyof RequestData)}
                </th>
              ))}
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + 1} className="text-center py-6">
                  Loading...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={columns.length + 1} className="text-center py-6 text-red-500">
                  {error}
                </td>
              </tr>
            ) : (
              sortedRequests.map((req) => (
                <tr key={req.id}>
                  {columns.map((col) => (
                    <td key={col} className="px-4 py-2">{getValue(req, col)}</td>
                  ))}
                  <td className="px-4 py-2">
                    <button
                      className="px-2 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      onClick={() => generateInvoice(req)}
                    >
                      Generate Invoice
                    </button>
                    <button
                      className="px-2 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 ml-2"
                      onClick={() => window.open(generateWhatsAppInvoiceLink(req), "_blank")}
                    >
                      WhatsApp
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}

