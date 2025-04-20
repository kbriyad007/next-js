"use client";

import { useEffect, useState } from "react";
import { db } from "../lib/firebase";  // Import the Firebase db from lib
import { collection, getDocs, doc, setDoc, getDoc } from "firebase/firestore";
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

        // Fetch order status from Firestore
        const statusPromises = data.map(async (req) => {
          const statusDocRef = doc(db, "order_status", req.id);
          const statusDoc = await getDoc(statusDocRef);
          if (statusDoc.exists()) {
            setStatusMap((prev) => ({
              ...prev,
              [req.id]: statusDoc.data()?.status || "—",
            }));
          }
        });

        await Promise.all(statusPromises);
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

    const formattedDate = req.Time
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

    // Update status in Firestore
    const statusDocRef = doc(db, "order_status", req.id);
    setDoc(statusDocRef, { status: "📧 Email Sent" });
    setStatusMap((prev) => ({ ...prev, [req.id]: "📧 Email Sent" }));
  };

  const generateWhatsAppInvoiceLink = (req: RequestData) => {
    const phone = (req["Phone-Number"] || "").replace(/\D/g, "");
    const formattedDate = req.Time
      ? new Date(req.Time.seconds * 1000).toLocaleDateString()
      : "N/A";

    const message = `
Hello ${req["Customer-Name"] || "Customer"}, 👋

Here is your order summary:

🧾 Invoice ID: ${req.id}
📦 Courier: ${req.Courier || "N/A"}
🔢 Quantity: ${req.Quantity || "N/A"}
🔗 Product Links:
${(req["Product-Links"] || []).map((link, i) => `  ${i + 1}. ${link}`).join("\n")}
📅 Order Date: ${formattedDate}

Best regards, ShipMate`;

    const whatsappLink = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappLink, "_blank");

    // Update status in Firestore
    const statusDocRef = doc(db, "order_status", req.id);
    setDoc(statusDocRef, { status: "✅ Sent to WhatsApp" });
    setStatusMap((prev) => ({ ...prev, [req.id]: "✅ Sent to WhatsApp" }));
  };

  const filteredRequests = requests.filter((request) =>
    `${request["Customer-Name"]} ${request["User-Email"]}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

const sortedRequests = filteredRequests; // Just skip sorting


  return (
    <Layout>
      <div className="container">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by customer or email"
        />

        {loading && <p>Loading...</p>}
        {error && <p>{error}</p>}

        <table>
          <thead>
            <tr>
              {showMinimal
                ? minimalColumns.map((col) => <th key={col}>{col}</th>)
                : allColumns.map((col) => (
                    <th key={col}>
                      <button onClick={() => handleSort(col as keyof RequestData)}>
                        {col}{" "}
                        {sortBy === col &&
                          (sortOrder === "asc" ? <ArrowUp /> : <ArrowDown />)}
                      </button>
                    </th>
                  ))}
            </tr>
          </thead>
          <tbody>
            {sortedRequests.map((request) => (
              <tr key={request.id}>
                {showMinimal ? (
                  <>
                    <td>{request["Customer-Name"]}</td>
                    <td>{statusMap[request.id]}</td>
                    <td>{request["User-Email"]}</td>
                    <td>{request["Phone-Number"]}</td>
                    <td>{request.Courier}</td>
                    <td>
                      <button onClick={() => generateWhatsAppInvoiceLink(request)}>
                        WhatsApp
                      </button>
                    </td>
                    <td>
                      <button onClick={() => generateInvoice(request)}>
                        <FileText />
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{request["Customer-Name"]}</td>
                    <td>{statusMap[request.id]}</td>
                    <td>{request["User-Email"]}</td>
                    <td>{request["Phone-Number"]}</td>
                    <td>{request.Courier}</td>
                    <td>{request.Address}</td>
                    <td>{request.Description}</td>
                    <td>{request["Product-Links"]?.join(", ")}</td>
                    <td>{request.Quantity}</td>
                    <td>{new Date(request.Time?.seconds * 1000).toLocaleString()}</td>
                    <td>{request.Message}</td>
                    <td>
                      <button onClick={() => generateWhatsAppInvoiceLink(request)}>
                        WhatsApp
                      </button>
                    </td>
                    <td>
                      <button onClick={() => generateInvoice(request)}>
                        <FileText />
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        <button onClick={() => setShowMinimal(!showMinimal)}>
          Toggle View {showMinimal ? "Full" : "Minimal"}
        </button>
      </div>
    </Layout>
  );
}
