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
      const res = await axios.get("http://localhost:5000/api/statistics/dashboard", {
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
          <p className="text-sm text-gray-500">Total Users</p>
          <p className="text-xl font-semibold">{stats.totalUsers}</p>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <p className="text-sm text-gray-500">Total Volunteers</p>
          <p className="text-xl font-semibold">{stats.totalVolunteers}</p>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <p className="text-sm text-gray-500">Total Disasters</p>
          <p className="text-xl font-semibold">{stats.totalDisasters}</p>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <p className="text-sm text-gray-500">Active Alerts</p>
          <p className="text-xl font-semibold">{stats.activeAlerts}</p>
        </div>
      </div>
    </div>
  );
}
