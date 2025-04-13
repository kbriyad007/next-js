"use client";

import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import Layout from "../components/Layout";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);

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

  return (
    <Layout>
      <div className="p-6 space-y-6 max-w-screen-2xl mx-auto text-white">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-semibold">User Requests</h1>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 transition rounded-xl"
          >
            Show Customer Table
          </button>
        </div>

        {/* 🚀 Analytics Widgets */}
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

        {loading && <p>Loading...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {/* ✅ Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center">
            <div className="bg-white text-black w-full max-w-3xl p-6 rounded-xl shadow-lg relative">
              <h2 className="text-xl font-semibold mb-4">Customer Contact Info</h2>
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-3 right-4 text-gray-600 hover:text-black text-xl"
              >
                &times;
              </button>

              <div className="overflow-x-auto rounded-lg border border-gray-300">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Customer Name</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">User Email</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Phone Number</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {requests.map((req) => (
                      <tr key={req.id}>
                        <td className="px-6 py-4">{req["Customer-Name"]}</td>
                        <td className="px-6 py-4">{req["User-Email"]}</td>
                        <td className="px-6 py-4">
                          {req["Phone-Number"] ? (
                            <a
                              href={`tel:${req["Phone-Number"].replace(/[^0-9+]/g, "")}`}
                              className="text-blue-600 underline"
                            >
                              {req["Phone-Number"]}
                            </a>
                          ) : (
                            "N/A"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

// 📊 Analytics Widget Component
function DashboardWidget({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="bg-gray-900 p-5 rounded-xl shadow-md border border-gray-800">
      <h3 className="text-sm text-gray-400 mb-2">{title}</h3>
      <p className="text-3xl font-semibold">{value}</p>
    </div>
  );
}

