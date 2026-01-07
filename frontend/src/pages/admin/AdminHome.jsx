import React, { useEffect, useState } from "react";
import axios from "axios";

export default function AdminHome() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const adminToken = localStorage.getItem("adminToken");

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/api/statistics", {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      setStats(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load stats. Please login again.");
      localStorage.removeItem("adminToken");
      localStorage.removeItem("admin");
      window.location.href = "/admin/login";
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) return <div className="p-6">Loading stats...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded shadow">
          <p className="text-sm text-gray-500">Users</p>
          <p className="text-xl font-semibold">{statistics.users}</p>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <p className="text-sm text-gray-500">Volunteers</p>
          <p className="text-xl font-semibold">{statistics.volunteers}</p>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <p className="text-sm text-gray-500">Disasters</p>
          <p className="text-xl font-semibold">{statistics.disasters}</p>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <p className="text-sm text-gray-500">Alerts</p>
          <p className="text-xl font-semibold">{statistics.alerts}</p>
        </div>
      </div>
    </div>
  );
}
