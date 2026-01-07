// src/pages/admin/Statistics.jsx
import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";

export default function Statistics() {
  const { user } = useContext(AuthContext);
  const token = user?.token;

  const [statistics, setStatistics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStatistics = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get("/api/statistics", {
        baseURL: "http://localhost:5000/api/statistics",
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

  if (loading) return <div className="p-6">Loading statistics...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Statistics</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm bg-white shadow rounded">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">Title</th>
              <th className="p-3">Value</th>
              <th className="p-3">Created By</th>
              <th className="p-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {statistics.map((stat) => (
              <tr key={stat._id} className="border-t">
                <td className="p-3">{stat.title}</td>
                <td className="p-3">{stat.value}</td>
                <td className="p-3">{stat.createdBy?.name || "N/A"}</td>
                <td className="p-3">{new Date(stat.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {statistics.length === 0 && (
              <tr>
                <td colSpan="4" className="p-3 text-center text-gray-500">
                  No statistics found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
