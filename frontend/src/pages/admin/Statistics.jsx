// src/pages/admin/Statistics.jsx
import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";

export default function Statistics() {
  const { user } = useContext(AuthContext);
  const token = user?.token;

  const [statistics, setStatistics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStatistics = async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const res = await axios.get("http://localhost:5000/api/statistics", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStatistics(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load statistics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, [token]);

  if (loading) {
    return (
      <div className="p-8 text-sm text-gray-500">
        Loading statistics...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-sm text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">
          System Statistics
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Overview of recorded system metrics
        </p>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full text-sm text-gray-700">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-6 py-3 font-medium text-gray-600">
                Title
              </th>
              <th className="px-6 py-3 font-medium text-gray-600">
                Value
              </th>
              <th className="px-6 py-3 font-medium text-gray-600">
                Created By
              </th>
              <th className="px-6 py-3 font-medium text-gray-600">
                Date
              </th>
            </tr>
          </thead>

          <tbody>
            {statistics.map((stat) => (
              <tr
                key={stat._id}
                className="border-b last:border-b-0 hover:bg-gray-50 transition"
              >
                <td className="px-6 py-4 font-medium text-gray-800">
                  {stat.title}
                </td>
                <td className="px-6 py-4">
                  {stat.value}
                </td>
                <td className="px-6 py-4">
                  {stat.createdBy?.name || "N/A"}
                </td>
                <td className="px-6 py-4 text-gray-500">
                  {new Date(stat.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}

            {statistics.length === 0 && (
              <tr>
                <td
                  colSpan="4"
                  className="px-6 py-10 text-center text-gray-500"
                >
                  No statistics available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
