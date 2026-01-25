import React, { useEffect, useState, useContext } from "react";
import axios from "../../api/axios";
import { AuthContext } from "../../context/AuthContext";
import {
  Users,
  ShieldCheck,
  Building2,
  AlertTriangle,
  Activity,
  Bell,
  Package,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

export default function AdminDashboard() {
  const { user, token } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;

    const fetchStats = async () => {
      try {
        setLoading(true);

        // Note: axios baseURL typically includes /api
        const res = await axios.get("/statistics/dashboard", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("Dashboard stats:", res.data); // debug once
        setStats(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token]);

  if (error) {
    return <div className="p-6 text-sm text-red-600">{error}</div>;
  }

  if (loading) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6 text-sm text-gray-500">
        No statistics available
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-800">
          Admin Dashboard
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          System overview & operational metrics
        </p>
      </header>

      {/* METRICS */}
      <section>
        <h2 className="text-lg font-medium text-gray-700 mb-4">
          Key Metrics
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Users}
            label="Total Users"
            value={stats.totalUsers}
            color="blue"
            trend="up"
          />
          <StatCard
            icon={ShieldCheck}
            label="Volunteers"
            value={stats.totalVolunteers}
            color="green"
            trend="up"
          />
          <StatCard
            icon={Building2}
            label="NGOs"
            value={stats.totalNGOs}
            color="purple"
          />
          <StatCard
            icon={AlertTriangle}
            label="Total Disasters"
            value={stats.totalDisasters}
            color="red"
            trend="down"
          />
          <StatCard
            icon={Activity}
            label="Active Disasters"
            value={stats.activeDisasters}
            color="orange"
          />
          <StatCard
            icon={ShieldCheck}
            label="Completed Missions"
            value={stats.totalCompletedMissions || 0}
            color="teal"
          />
          <StatCard
            icon={Package}
            label="Aid Distributed"
            value={stats.totalDistributedAid || 0}
            color="green"
          />
          <StatCard
            icon={Bell}
            label="Active Alerts"
            value={stats.activeAlerts}
            color="yellow"
          />
        </div>
      </section>
    </div>
  );
}

/* ===============================
   STAT CARD
================================ */
function StatCard({ icon: Icon, label, value, color, trend }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    red: "bg-red-50 text-red-600",
    orange: "bg-orange-50 text-orange-600",
    teal: "bg-teal-50 text-teal-600",
    yellow: "bg-yellow-50 text-yellow-600",
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow transition relative">
      {/* Accent Bar */}
      <div
        className={`absolute left-0 top-0 h-full w-1 rounded-l-xl ${colors[color]?.replace("text", "bg")
          }`}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colors[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
          <p className="text-sm text-gray-500">{label}</p>
        </div>

        {trend === "up" && (
          <TrendingUp className="w-4 h-4 text-green-500" />
        )}
        {trend === "down" && (
          <TrendingDown className="w-4 h-4 text-red-500" />
        )}
      </div>

      <p className="mt-4 text-3xl font-semibold text-gray-800">
        {value ?? 0}
      </p>
    </div>
  );
}

/* ===============================
   SKELETON CARD
================================ */
function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-gray-200 rounded-lg" />
        <div className="h-4 w-24 bg-gray-200 rounded" />
      </div>
      <div className="mt-6 h-8 w-20 bg-gray-200 rounded" />
    </div>
  );
}
