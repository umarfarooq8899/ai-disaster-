// src/pages/admin/AdminHome.jsx
import React, { useEffect, useState } from "react";
import { Users, AlertCircle, Zap, MapPin } from "lucide-react";
import { getDashboardStats } from "../../api/admin";

export default function AdminHome() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getDashboardStats();
        setStats(res.data);
      } catch (err) {
        console.error(err);
        if (err.response?.status === 401) setError("Unauthorized. Please log in as admin.");
        else setError("Failed to fetch stats");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="p-6">Loading dashboard...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-600 mt-1">Overview and administrative controls</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-start">
          <div className="flex items-center space-x-3 text-slate-500">
            <Users className="w-6 h-6 text-indigo-500" />
            <span className="text-sm">Total Users</span>
          </div>
          <div className="text-3xl font-bold mt-3">{stats.users}</div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-start">
          <div className="flex items-center space-x-3 text-slate-500">
            <MapPin className="w-6 h-6 text-green-500" />
            <span className="text-sm">Disasters</span>
          </div>
          <div className="text-3xl font-bold mt-3">{stats.disasters}</div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-start">
          <div className="flex items-center space-x-3 text-slate-500">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <span className="text-sm">Active Alerts</span>
          </div>
          <div className="text-3xl font-bold mt-3">{stats.alerts}</div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-start">
          <div className="flex items-center space-x-3 text-slate-500">
            <Zap className="w-6 h-6 text-yellow-500" />
            <span className="text-sm">Volunteers</span>
          </div>
          <div className="text-3xl font-bold mt-3">{stats.volunteers}</div>
        </div>
      </div>
    </div>
  );
}
