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
    return value ? String(value) : "N/A";
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
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
      <div className="min-h-screen bg-gray-100 p-6">
        <h1 className="text-3xl font-semibold text-gray-800 mb-4">Customer Requests</h1>
        <div className="mb-4 flex items-center">
          <input
            type="text"
            placeholder="Search for requests..."
            value={search}
            onChange={handleSearch}
            className="p-2 border rounded-md shadow-sm w-full max-w-xs mr-4"
          />
          <button
            onClick={() => setShowMinimal(!showMinimal)}
            className="p-2 px-4 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700"
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
                    <div className="flex items-center">
                      {column}
                      {sortBy === column && (sortOrder === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedRequests.map((req) => (
                <tr key={req.id} className="border-b hover:bg-gray-50">
                  {showMinimal
                    ? minimalColumns.map((col) => (
                        <td key={col} className="py-2 px-4 text-sm">{getValue(req, col)}</td>
                      ))
                    : allColumns.map((col) => (
                        <td key={col} className="py-2 px-4 text-sm">{getValue(req, col)}</td>
                      ))}
                  <td className="py-2 px-4 text-sm">
                    <button
                      className="bg-green-600 text-white py-1 px-3 rounded-md hover:bg-green-700"
                      onClick={() => generateInvoice(req)}
                    >
                      Generate Invoice
                    </button>
                    <a
                      href={generateWhatsAppInvoiceLink(req)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 bg-blue-600 text-white py-1 px-3 rounded-md hover:bg-blue-700"
                    >
                      Send on WhatsApp
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}

