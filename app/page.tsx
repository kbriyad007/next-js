"use client";

import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import Layout from "../components/Layout";

export default function Home() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const querySnapshot = await getDocs(collection(db, "user_request"));
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRequests(data);
    };

    fetchData();
  }, []);

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">
          User Requests
        </h1>
        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
              <tr>
                <th className="px-4 py-3 text-left font-semibold uppercase">
                  Customer Name
                </th>
                <th className="px-4 py-3 text-left font-semibold uppercase">
                  User Email
                </th>
                <th className="px-4 py-3 text-left font-semibold uppercase">
                  Address
                </th>
                <th className="px-4 py-3 text-left font-semibold uppercase w-64">
                  Description
                </th>
                <th className="px-4 py-3 text-left font-semibold uppercase">
                  Product Links
                </th>
                <th className="px-4 py-3 text-left font-semibold uppercase">
                  Quantity
                </th>
                <th className="px-4 py-3 text-left font-semibold uppercase">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {requests.map((req, idx) => (
                <tr
                  key={req.id}
                  className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="px-4 py-3 text-gray-800 whitespace-nowrap">
                    {req["Customer-Name"]}
                  </td>
                  <td className="px-4 py-3 text-gray-800 whitespace-nowrap">
                    {req["User-Email"]}
                  </td>
                  <td className="px-4 py-3 text-gray-800 whitespace-nowrap">
                    {req.Address}
                  </td>
                  <td className="px-4 py-3 text-gray-800 whitespace-normal w-64">
                    {req.Description}
                  </td>
                  <td className="px-4 py-3 text-blue-600 whitespace-nowrap">
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
                              window.open(
                                link,
                                "popup",
                                "width=800,height=600"
                              );
                            }}
                            className="text-blue-500 underline hover:text-blue-800"
                          >
                            Link-{i + 1}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400">No Links</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-800 whitespace-nowrap">
                    {req.Quantity}
                  </td>
                  <td className="px-4 py-3 text-gray-800 whitespace-nowrap">
                    {req.Time?.seconds
                      ? new Date(req.Time.seconds * 1000).toLocaleString()
                      : "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
