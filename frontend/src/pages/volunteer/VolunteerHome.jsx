import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../../api/axios";

export default function VolunteerHome() {
  const [stats, setStats] = useState({
    assignedTasks: 0,
    nearbyAlerts: 0,
    isAvailable: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await axiosInstance.get("/volunteer/stats");
        setStats(res.data);
      } catch (err) {
        console.error("Failed to fetch volunteer stats:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) return <div className="p-6">Loading dashboard...</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold">Volunteer Dashboard</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        <div className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition">
          <h3 className="text-lg font-semibold mb-2">Assigned Tasks</h3>
          <p className="text-3xl font-bold text-brand-700">{stats.assignedTasks}</p>
          <Link to="/dashboard/volunteer/tasks" className="text-sm text-brand-600 hover:underline mt-2 block">
            View Tasks
          </Link>
        </div>

        <div className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition">
          <h3 className="text-lg font-semibold mb-2">Nearby Alerts</h3>
          <p className="text-3xl font-bold text-red-600">{stats.nearbyAlerts}</p>
          <Link to="/dashboard/volunteer/nearby" className="text-sm text-red-600 hover:underline mt-2 block">
            View Alerts
          </Link>
        </div>

        {/* Removed Availability Toggle Card as it's now in the header */}
      </div>
    </div>
  );
}
