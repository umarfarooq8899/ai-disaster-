import { useEffect, useState, useContext } from "react";
import axios from "../../api/axios";
import { AuthContext } from "../../context/AuthContext";

export default function Statistics() {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (!user?.token) return;
        const res = await axios.get("/statistics", {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setStats(res.data);
      } catch (err) {
        console.error("Failed to load statistics", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  if (loading) {
    return (
      <div className="p-6 text-sm text-gray-500">
        Loading statistics...
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
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">
          Dashboard Overview
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Key system metrics at a glance
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Users" value={stats.totalUsers} />
        <StatCard title="Rescue Teams" value={stats.totalRescue} />
        <StatCard title="NGOs" value={stats.totalNGO} />
        <StatCard title="Disasters" value={stats.totalDisasters} />
      </div>
    </div>
  );
}

/* Reusable professional card */
function StatCard({ title, value }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 hover:shadow transition">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="mt-2 text-3xl font-semibold text-gray-800">
        {value}
      </p>
    </div>
  );
}
