import React, { useEffect, useState, useContext } from "react";
import axios from "../../api/axios";
import { AuthContext } from "../../context/AuthContext";
import { Users, Activity, Bell, TrendingUp, TrendingDown } from "lucide-react";

/* ===============================
   STAT CARD COMPONENT
================================ */
function StatCard({ icon: Icon, label, value, color, trend }) {
  const colors = {
    blue: { bg: "bg-blue-50 text-blue-600", text: "text-blue-600", accent: "bg-blue-600" },
    green: { bg: "bg-green-50 text-green-600", text: "text-green-600", accent: "bg-green-600" },
    orange: { bg: "bg-orange-50 text-orange-600", text: "text-orange-600", accent: "bg-orange-600" },
    teal: { bg: "bg-teal-50 text-teal-600", text: "text-teal-600", accent: "bg-teal-600" },
    red: { bg: "bg-red-50 text-red-600", text: "text-red-600", accent: "bg-red-600" },
  };

  const c = colors[color] || colors.blue;

  return (
    <div className="relative bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-lg transition-transform transform hover:-translate-y-1">
      {/* Accent bar */}
      <div className={`absolute left-0 top-0 h-full w-1 rounded-l-xl ${c.accent}`} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${c.bg}`}>
            <Icon className={`w-5 h-5 ${c.text}`} />
          </div>
          <p className="text-sm text-gray-500">{label}</p>
        </div>

        {trend === "up" && <TrendingUp className="w-5 h-5 text-green-500" />}
        {trend === "down" && <TrendingDown className="w-5 h-5 text-red-500" />}
      </div>

      <p className="mt-4 text-2xl font-semibold text-gray-800">{value ?? 0}</p>
    </div>
  );
}

/* ===============================
   RESCUE DASHBOARD
================================ */
export default function RescueDashboard() {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.token) return;

    const fetchStats = async () => {
      try {
        const res = await axios.get("/statscard/dashboard", {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setStats(res.data);
      } catch (err) {
        setError("Failed to load rescue dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user?.token]);

  if (loading)
    return (
      <div className="p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse h-32"
          />
        ))}
      </div>
    );

  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!stats) return <div className="p-8 text-gray-600">No data available</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-800">Rescue Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of rescue operations</p>
      </header>

      {/* METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Users}
          label="Active Volunteers"
          value={stats.activeVolunteers}
          color="green"
          trend="up"
        />
        <StatCard
          icon={Activity}
          label="Ongoing Missions"
          value={stats.ongoingMissions}
          color="blue"
          trend="up"
        />
        <StatCard
          icon={Bell}
          label="Active Alerts"
          value={stats.activeAlerts}
          color="orange"
          trend="down"
        />
        <StatCard
          icon={Activity}
          label="Resolved Missions"
          value={stats.resolvedMissions}
          color="teal"
          trend="up"
        />
      </div>
    </div>
  );
}
