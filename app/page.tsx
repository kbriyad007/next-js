"use client";
import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowUpDown } from "lucide-react";
import QRCode from "qrcode.react";
import { generateInvoice } from "@/app/utils/invoiceGenerator";
import { sendWhatsAppMessage } from "@/app/utils/sendWhatsApp";

export default function CustomerInfoModal() {
  const [requests, setRequests] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [statusMap, setStatusMap] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchData() {
      const querySnapshot = await getDocs(collection(db, "user_request"));
      const data: any[] = [];
      const statusUpdates: Record<string, string> = {};
      querySnapshot.forEach((doc) => {
        const requestData = { id: doc.id, ...doc.data() };
        data.push(requestData);
        if (requestData.status) {
          statusUpdates[doc.id] = requestData.status;
        }
      });
      setRequests(data);
      setStatusMap(statusUpdates);
    }
    fetchData();
  }, []);

  const handleInvoice = async (req: any) => {
    await generateInvoice(req);
    const newStatus = "📧 Email Sent";
    setStatusMap((prev) => ({ ...prev, [req.id]: newStatus }));
    await updateDoc(doc(db, "user_request", req.id), {
      status: newStatus,
    });
  };

  const handleWhatsApp = async (req: any) => {
    const message = `Hey ${req.customerName}, your order is confirmed!`;
    await sendWhatsAppMessage(req.phone, message);
    const newStatus = "✅ Sent to WhatsApp";
    setStatusMap((prev) => ({ ...prev, [req.id]: newStatus }));
    await updateDoc(doc(db, "user_request", req.id), {
      status: newStatus,
    });
  };

  const [sortAsc, setSortAsc] = useState(true);

  const sortedRequests = [...requests].sort((a, b) => {
    const nameA = a.customerName?.toLowerCase() || "";
    const nameB = b.customerName?.toLowerCase() || "";
    return sortAsc ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
  });

  return (
    <>
      <Button
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={() => setShowModal(true)}
      >
        Show Customer Info
      </Button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Customer Information</h2>
              <Button
                variant="outline"
                onClick={() => setShowModal(false)}
              >
                Close
              </Button>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer Name
                    <button
                      onClick={() => setSortAsc(!sortAsc)}
                      className="ml-1"
                    >
                      <ArrowUpDown className="w-4 h-4 inline" />
                    </button>
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Email</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone Number</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Courier</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">WhatsApp</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">QR</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedRequests.map((req, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 whitespace-nowrap">{req.customerName}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{req.userEmail}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <a
                        href={`tel:${req.phone}`}
                        className="text-blue-600 hover:underline"
                      >
                        {req.phone}
                      </a>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">{req.courier}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {statusMap[req.id] || "—"}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <Button onClick={() => handleInvoice(req)}>
                        Invoice
                      </Button>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <Button onClick={() => handleWhatsApp(req)}>
                        WhatsApp
                      </Button>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <Card className="p-2">
                        <QRCode value={req.phone || ""} size={64} />
                      </Card>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
