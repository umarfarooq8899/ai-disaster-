import React, { useEffect, useState, useContext } from "react";
import axios from "../../api/axios";
import { AuthContext } from "../../context/AuthContext";
import { Link } from "react-router-dom";
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
  RefreshCw,
} from "lucide-react";

export default function AdminDashboard() {
  const { user, token } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsRes, activityRes] = await Promise.all([
        axios.get("/statistics/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("/statistics/activity", {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);
      setStats(statsRes.data);
      setActivities(activityRes.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
        setLoading(true);
        await axios.get("/statistics/sync", {
            headers: { Authorization: `Bearer ${token}` },
        });
        await fetchStats();
        alert("Statistics synchronized successfully!");
    } catch (err) {
        console.error("Sync failed:", err);
        alert("Failed to sync statistics.");
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchStats();
  }, [token]);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 shadow-sm flex flex-col items-center gap-4">
          <AlertTriangle className="w-8 h-8" />
          <p className="font-semibold text-sm">{error}</p>
          <button 
            onClick={fetchData}
            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-bold transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 bg-slate-50 min-h-screen">
        <div className="max-w-7xl mx-auto space-y-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 rounded-3xl border shadow-soft animate-pulse">
                <div className="h-10 w-64 bg-slate-100 rounded-lg"></div>
            </header>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6 text-sm text-slate-500 bg-slate-50 min-h-screen flex items-center justify-center">
        No statistics available
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 font-sans antialiased">
        <div className="max-w-7xl mx-auto space-y-8">
            {/* HEADER SECTION */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 rounded-3xl border shadow-soft">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="relative">
                            <div className="w-2.5 h-2.5 bg-brand-500 rounded-full animate-pulse" />
                            <div className="absolute inset-0 w-2.5 h-2.5 bg-brand-500 rounded-full animate-ping opacity-30" />
                        </div>
                        <span className="text-[10px] font-black text-brand-600 uppercase tracking-widest">System Overview</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Activity className="w-8 h-8 text-brand-600" />
                        Admin Dashboard
                    </h1>
                </div>
                <div className="mt-4 md:mt-0 flex flex-wrap items-center gap-3">
                    <button
                        onClick={handleSync}
                        disabled={loading}
                        className="px-4 py-2 bg-brand-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-700 transition-all active:scale-95 shadow-md flex items-center gap-2 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                        Sync All Stats
                    </button>
                    <button
                        onClick={fetchStats}
                        disabled={loading}
                        className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:text-brand-600 hover:border-brand-200 transition-all active:scale-95 shadow-sm flex items-center gap-2 font-bold text-xs"
                    >
                        <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                    <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl">
                        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">System Operational</span>
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT AREA */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* STATS SECTION (LEFT 2 COLS) */}
                <div className="lg:col-span-2 space-y-8">
                    <section className="bg-white rounded-3xl border shadow-soft overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-2 h-full bg-brand-500" />
                        <div className="p-10">
                            <header className="flex justify-between items-start mb-8 text-left">
                                <div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Live Metrics</span>
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Operational Statistics</h2>
                                </div>
                            </header>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <StatCard
                                    icon={Users}
                                    label="Total Users"
                                    value={stats.totalUsers}
                                    color="brand"
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
                        </div>
                    </section>
                </div>

                {/* ACTIVITY FEED (RIGHT 1 COL) */}
                <div className="lg:col-span-1">
                    <section className="bg-white rounded-3xl border shadow-soft h-full overflow-hidden flex flex-col min-h-[600px]">
                        <div className="p-8 border-b bg-slate-50/50">
                            <div className="flex items-center justify-between mb-1">
                                <h3 className="font-black text-slate-900 tracking-tight flex items-center gap-2">
                                    <RefreshCw className="w-4 h-4 text-brand-600" />
                                    System Activity
                                </h3>
                                <span className="text-[9px] font-bold bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full uppercase">Live</span>
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium">Recent operations across all teams</p>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[800px]">
                            {activities.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                        <Activity className="w-6 h-6 text-slate-300" />
                                    </div>
                                    <p className="text-sm text-slate-400 font-medium italic">No recent activity recorded.</p>
                                </div>
                            ) : (
                                activities.map((log) => (
                                    <div key={log._id} className="group relative pl-4 pb-2 border-l-2 border-slate-100 last:pb-0 hover:border-brand-300 transition-colors">
                                        <div className="absolute -left-[9px] top-0 w-4 h-4 bg-white border-2 border-slate-200 rounded-full group-hover:border-brand-500 group-hover:scale-110 transition-all" />
                                        
                                        <div className="bg-slate-50/50 rounded-2xl p-4 border border-transparent group-hover:border-slate-100 group-hover:bg-white group-hover:shadow-sm transition-all">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] font-black text-brand-600 uppercase tracking-tighter">
                                                    {log.organization?.name || 'System'}
                                                </span>
                                                <span className="text-[9px] text-slate-400 font-bold">
                                                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <h4 className="text-sm font-bold text-slate-800 mb-1 line-clamp-1">{log.disaster?.title || 'General Update'}</h4>
                                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{log.description}</p>
                                            <div className="mt-3 flex items-center gap-2">
                                                <span className="text-[9px] bg-white border px-2 py-0.5 rounded-lg font-bold text-slate-600 shadow-sm uppercase tracking-tighter">
                                                    {log.updateType}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        
                        <div className="p-6 border-t bg-slate-50/30">
                            <Link to="/dashboard/admin/mission-history" className="text-xs font-black text-brand-600 hover:text-brand-700 flex items-center gap-2 justify-center group">
                                View Full Audit Trail
                                <TrendingUp className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                        </div>
                    </section>
                </div>
            </section>
        </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, trend }) {
  const accentClasses = {
    brand: { bg: "bg-brand-50", text: "text-brand-600", border: "border-brand-100", shadow: "shadow-brand-100" },
    green: { bg: "bg-green-50", text: "text-green-600", border: "border-green-100", shadow: "shadow-green-100" },
    purple: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-100", shadow: "shadow-purple-100" },
    red: { bg: "bg-red-50", text: "text-red-600", border: "border-red-100", shadow: "shadow-red-100" },
    orange: { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-100", shadow: "shadow-orange-100" },
    teal: { bg: "bg-teal-50", text: "text-teal-600", border: "border-teal-100", shadow: "shadow-teal-100" },
    yellow: { bg: "bg-yellow-50", text: "text-yellow-600", border: "border-yellow-100", shadow: "shadow-yellow-100" },
  };

  const scheme = accentClasses[color] || accentClasses.brand;

  return (
    <div className={`bg-white border rounded-2xl p-6 transition-all duration-300 relative group hover:-translate-y-1 hover:shadow-lg ${scheme.border} hover:${scheme.shadow}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl transition-colors ${scheme.bg} ${scheme.text} group-hover:bg-white group-hover:shadow-sm`}>
            <Icon className="w-5 h-5" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</p>
        </div>

        {trend === "up" && (
          <div className="bg-green-50 p-1.5 rounded-lg border border-green-100">
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
        )}
        {trend === "down" && (
          <div className="bg-red-50 p-1.5 rounded-lg border border-red-100">
            <TrendingDown className="w-4 h-4 text-red-500" />
          </div>
        )}
      </div>

      <p className="mt-5 text-4xl font-black text-slate-900 tracking-tight">
        {value ?? 0}
      </p>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-100 rounded-xl" />
        <div className="h-3 w-24 bg-slate-100 rounded" />
      </div>
      <div className="mt-8 h-10 w-20 bg-slate-100 rounded-lg" />
    </div>
  );
}
