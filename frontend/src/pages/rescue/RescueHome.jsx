import React, { useEffect, useState, useContext } from "react";
import axios from "../../api/axios";
import { AuthContext } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import { Users, Activity, Bell, History, PlusSquare } from "lucide-react";

/* ================= STAT CARD ================= */
function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    blue: "bg-brand-50 text-brand-600",
    green: "bg-emerald-50 text-emerald-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
    red: "bg-red-50 text-red-600",
    teal: "bg-teal-50 text-teal-600",
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${colors[color] || colors.blue}`}>
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

export default function RescueHome() {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeVolunteers: 0,
    ongoingMissions: 0,
    pendingMissions: 0,
    activeAlerts: 0,
    resolvedMissions: 0,
  });
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, activityRes] = await Promise.all([
          axios.get("/rescue/stats"),
          axios.get("/rescue/activity")
        ]);
        setStats(statsRes.data);
        setActivities(activityRes.data);
      } catch (err) {
        console.error("Failed to fetch Rescue data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Rescue Dashboard</h1>
        <p className="text-gray-500">
          Welcome back, {user?.name || "Coordinator"}
        </p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
        <StatCard
          icon={Users}
          label="Active Volunteers"
          value={stats.activeVolunteers}
          color="green"
        />
        <StatCard
          icon={Activity}
          label="Ongoing Missions"
          value={stats.ongoingMissions}
          color="blue"
        />
        <StatCard
          icon={Activity}
          label="Pending Missions"
          value={stats.pendingMissions}
          color="orange"
        />
        <StatCard
          icon={Bell}
          label="Active Alerts"
          value={stats.activeAlerts}
          color="red"
        />
        <StatCard
          icon={History}
          label="Resolved Missions"
          value={stats.resolvedMissions}
          color="teal"
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
                  <div className={`mt-1 p-2 rounded-full h-fit flex-shrink-0 ${log.updateType === 'rescued' ? 'bg-emerald-100 text-emerald-600' : 'bg-brand-100 text-brand-600'}`}>
                    <Activity className="w-4 h-4" />
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

        {/* Quick Links */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
          <div className="space-y-3">
            <Link to="/dashboard/rescue/missions" className="block w-full text-left p-3 rounded-lg bg-gray-50 hover:bg-gray-100 text-brand-600 font-medium transition">
              View All Missions
            </Link>
            <Link to="/dashboard/rescue/missions/new" className="block w-full text-left p-3 rounded-lg bg-gray-50 hover:bg-gray-100 text-brand-600 font-medium transition flex items-center justify-between">
              <span>Create New Mission</span>
              <PlusSquare className="w-4 h-4" />
            </Link>
            <Link to="/dashboard/rescue/volunteers" className="block w-full text-left p-3 rounded-lg bg-gray-50 hover:bg-gray-100 text-brand-600 font-medium transition">
              Manage Volunteers
            </Link>
            <Link to="/dashboard/rescue/history" className="block w-full text-left p-3 rounded-lg bg-gray-50 hover:bg-gray-100 text-brand-600 font-medium transition">
              Mission History
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
