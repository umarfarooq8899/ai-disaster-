import React, { useEffect, useState, useContext } from "react";
import axios from "../../api/axios";
import { AuthContext } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import { Users, Activity, HeartHandshake, Package } from "lucide-react";

/* ================= STAT CARD ================= */
function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    blue: "bg-brand-50 text-brand-600",
    green: "bg-emerald-50 text-emerald-600",
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
    totalDistributed: 0
  });
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, activityRes] = await Promise.all([
          axios.get("/ngo/stats"),
          axios.get("/ngo/activity")
        ]);
        setStats(statsRes.data);
        setActivities(activityRes.data);
      } catch (err) {
        console.error("Failed to fetch NGO data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
          label="Items in Stock"
          value={stats.resources}
          color="orange"
        />
        <StatCard
          icon={Activity}
          label="Total Distributed"
          value={stats.totalDistributed}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="font-semibold text-lg mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {activities.length === 0 ? (
              <p className="text-gray-500 text-sm italic">
                No recent activity recorded.
              </p>
            ) : (
              activities.map((log) => (
                <div key={log._id} className="flex gap-4 p-3 rounded-lg hover:bg-gray-50 transition border border-transparent hover:border-gray-100">
                  <div className={`mt-1 p-2 rounded-full h-fit flex-shrink-0 ${log.updateType === 'food' ? 'bg-orange-100 text-orange-600' : 'bg-brand-100 text-brand-600'}`}>
                    {log.updateType === 'food' ? <Package className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{log.disaster?.title || 'Unknown Disaster'}</p>
                    <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">{log.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded uppercase font-bold text-slate-500">
                        {log.updateType}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
          <div className="space-y-3">
            <Link to="/dashboard/ngo/volunteers" className="block w-full text-left p-3 rounded-lg bg-gray-50 hover:bg-gray-100 text-brand-600 font-medium transition">
              View All Volunteers
            </Link>
            <Link to="/dashboard/ngo/resources" className="block w-full text-left p-3 rounded-lg bg-gray-50 hover:bg-gray-100 text-brand-600 font-medium transition">
              Manage Resources
            </Link>
            <Link to="/dashboard/ngo/assignments/new" className="block w-full text-left p-3 rounded-lg bg-gray-50 hover:bg-gray-100 text-brand-600 font-medium transition">
              Create New Assignment
            </Link>
            <Link to="/dashboard/ngo/history" className="block w-full text-left p-3 rounded-lg bg-gray-50 hover:bg-gray-100 text-brand-600 font-medium transition">
              Aid Distribution History
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
