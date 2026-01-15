import React, { useEffect, useState, useContext } from "react";
import axios from "../../api/axios";
import { AuthContext } from "../../context/AuthContext";
import { Users, Activity, HeartHandshake, Package } from "lucide-react";

/* ================= STAT CARD ================= */
function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default function NGOHome() {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    volunteers: 0,
    activeMissions: 0,
    resources: 0,
  });

  useEffect(() => {
    // In a real app we would fetch stats. For now mocking or using generic stats
    // We can implement a specific endpoint later.
    // Simulating loading
    setTimeout(() => {
      setStats({
        volunteers: 12, // example
        activeMissions: 3,
        resources: 150,
      });
      setLoading(false);
    }, 800);
  }, []);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">NGO Dashboard</h1>
        <p className="text-gray-500">
          Welcome back, {user?.name || "Coordinator"}
        </p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          icon={Users}
          label="My Volunteers"
          value={stats.volunteers}
          color="blue"
        />
        <StatCard
          icon={HeartHandshake}
          label="Active Missions"
          value={stats.activeMissions}
          color="green"
        />
        <StatCard
          icon={Package}
          label="Resources Available"
          value={stats.resources}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions / Recent Activity Placeholder */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="font-semibold text-lg mb-4">Recent Activity</h3>
          <p className="text-gray-500 text-sm">
            No recent activity to display.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
          <div className="space-y-3">
            <button className="w-full text-left p-3 rounded-lg bg-gray-50 hover:bg-gray-100 text-blue-600 font-medium transition">
              View All Volunteers
            </button>
            <button className="w-full text-left p-3 rounded-lg bg-gray-50 hover:bg-gray-100 text-blue-600 font-medium transition">
              Manage Resources
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
