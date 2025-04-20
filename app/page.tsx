"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  DocumentData,
} from "firebase/firestore";
import { FaSort } from "react-icons/fa";
import QRCode from "react-qr-code";

const UserRequestTable = () => {
  const [requests, setRequests] = useState<DocumentData[]>([]);
  const [search, setSearch] = useState("");
  const [showMinimal, setShowMinimal] = useState(true);
  const [sortField, setSortField] = useState("timestamp");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    const fetchRequests = async () => {
      const q = query(collection(db, "userRequests"), orderBy("timestamp", "desc"));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRequests(data);
    };

    fetchRequests();
  }, []);

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const sortedRequests = [...requests].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
    if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const filteredRequests = sortedRequests.filter((req) => {
    const fieldsToSearch = [
      req.name,
      req.email,
      req.phoneNumber,
      req.timestamp?.toDate?.().toLocaleString?.(),
    ];
    return fieldsToSearch.some((field) =>
      field?.toLowerCase?.().includes(search.toLowerCase())
    );
  });

  return (
    <div className="w-full p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">User Requests</h1>
        <button
          onClick={() => setShowMinimal((prev) => !prev)}
          className="px-3 py-1 text-xs bg-blue-600 rounded-lg"
        >
          {showMinimal ? "Full View" : "Minimal View"}
        </button>
      </div>

      <input
        type="text"
        placeholder="Search..."
        className="w-full max-w-md px-3 py-1.5 border rounded-lg text-black text-sm"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="overflow-x-auto rounded-xl border border-gray-700 shadow-sm">
        <table className="min-w-full text-xs text-left text-gray-200">
          <thead className="bg-gray-900 text-white uppercase text-[10px] tracking-wider">
            <tr>
              <th className="px-4 py-2 cursor-pointer" onClick={() => handleSort("name")}>
                Name <FaSort className="inline ml-1" />
              </th>
              <th className="px-4 py-2 cursor-pointer" onClick={() => handleSort("email")}>
                Email <FaSort className="inline ml-1" />
              </th>
              <th className="px-4 py-2 cursor-pointer" onClick={() => handleSort("phoneNumber")}>
                Phone Number <FaSort className="inline ml-1" />
              </th>
              {!showMinimal && (
                <>
                  <th className="px-4 py-2">Product Links</th>
                  <th className="px-4 py-2">Courier</th>
                  <th className="px-4 py-2">Message</th>
                  <th className="px-4 py-2">QR</th>
                </>
              )}
              <th className="px-4 py-2 cursor-pointer" onClick={() => handleSort("timestamp")}>
                Time <FaSort className="inline ml-1" />
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map((req) => (
              <tr key={req.id} className="hover:bg-gray-800 transition-colors text-[11px]">
                <td className="px-4 py-2">{req.name}</td>
                <td className="px-4 py-2">{req.email}</td>
                <td className="px-4 py-2">
                  <a href={`https://wa.me/${req.phoneNumber}`} target="_blank" rel="noopener noreferrer" className="text-green-400 underline">
                    {req.phoneNumber}
                  </a>
                </td>
                {!showMinimal && (
                  <>
                    <td className="px-4 py-2 whitespace-nowrap max-w-[180px] overflow-auto">
                      {Array.isArray(req.productLinks) ? (
                        <ul className="list-disc ml-4 space-y-1">
                          {req.productLinks.map((link: string, index: number) => (
                            <li key={index}>
                              <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-300 underline">
                                Product {index + 1}
                              </a>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span>{req.productLinks}</span>
                      )}
                    </td>
                    <td className="px-4 py-2">{req.courier}</td>
                    <td className="px-4 py-2 whitespace-pre-wrap max-w-xs">{req.message}</td>
                    <td className="px-4 py-2">
                      <div className="w-12 h-12">
                        <QRCode value={`Name: ${req.name}\nEmail: ${req.email}\nPhone: ${req.phoneNumber}`} size={64} />
                      </div>
                    </td>
                  </>
                )}
                <td className="px-4 py-2">
                  {req.timestamp?.toDate?.().toLocaleString?.() ?? "N/A"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserRequestTable;
