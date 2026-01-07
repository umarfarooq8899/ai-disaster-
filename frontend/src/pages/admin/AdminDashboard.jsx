// src/pages/admin/AdminDashboard.jsx
import React, { useEffect, useState, useContext } from "react";
import axios from "../../api/axios";
import { AuthContext } from "../../context/AuthContext";

export default function AdminDashboard() {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch statistics from backend
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = user?.token; // assume user object has token
        const res = await axios.get("/statistics", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(res.data);
      } catch (err) {
        console.error("Failed to load statistics", err);
        setError("Failed to load statistics");
      } finally {
        setLoading(false);
      }
    };

    if (user?.token) fetchStats();
  }, [user]);

  if (loading) return <div className="p-6 text-gray-700">Loading statistics...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* PAGE HEADER */}
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Overview of users, disasters, alerts, and system statistics
        </p>
      </header>

      {/* STATISTICS CARDS */}
      <section>
        <h2 className="text-xl font-semibold mb-4 text-gray-700">
          Key Statistics
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {/* Users */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-5 rounded-xl shadow hover:scale-105 transform transition">
            <h3 className="text-lg font-semibold">Total Users</h3>
            <p className="text-3xl font-bold mt-2">{stats.totalUsers}</p>
          </div>

          {/* Volunteers */}
          <div className="bg-gradient-to-r from-green-600 to-green-500 text-white p-5 rounded-xl shadow hover:scale-105 transform transition">
            <h3 className="text-lg font-semibold">Volunteers</h3>
            <p className="text-3xl font-bold mt-2">{stats.totalVolunteers}</p>
          </div>

          {/* NGOs */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-500 text-white p-5 rounded-xl shadow hover:scale-105 transform transition">
            <h3 className="text-lg font-semibold">NGOs</h3>
            <p className="text-3xl font-bold mt-2">{stats.totalNGOs}</p>
          </div>

          {/* Disasters */}
          <div className="bg-gradient-to-r from-red-600 to-red-500 text-white p-5 rounded-xl shadow hover:scale-105 transform transition">
            <h3 className="text-lg font-semibold">Total Disasters</h3>
            <p className="text-3xl font-bold mt-2">{stats.totalDisasters}</p>
          </div>

          {/* Active Disasters */}
          <div className="bg-gradient-to-r from-orange-600 to-orange-500 text-white p-5 rounded-xl shadow hover:scale-105 transform transition">
            <h3 className="text-lg font-semibold">Active Disasters</h3>
            <p className="text-3xl font-bold mt-2">{stats.activeDisasters}</p>
          </div>

          {/* Resolved Disasters */}
          <div className="bg-gradient-to-r from-teal-600 to-teal-500 text-white p-5 rounded-xl shadow hover:scale-105 transform transition">
            <h3 className="text-lg font-semibold">Resolved Disasters</h3>
            <p className="text-3xl font-bold mt-2">{stats.resolvedDisasters}</p>
          </div>

          {/* Alerts */}
          <div className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-white p-5 rounded-xl shadow hover:scale-105 transform transition">
            <h3 className="text-lg font-semibold">Active Alerts</h3>
            <p className="text-3xl font-bold mt-2">{stats.activeAlerts}</p>
          </div>
        </div>
      </section>
    </div>
  );
}


