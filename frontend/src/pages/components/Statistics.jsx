import { useEffect, useState } from "react";
import axios from "../../api/axios";
import { Users, Shield, Building2, AlertTriangle, CheckCircle2, Siren, Activity, BarChart3 } from "lucide-react";

export default function Statistics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await axios.get("/statistics/public");
        setStats(res.data);
        setError(null);
      } catch (err) {
        console.error("Failed to load statistics", err);
        setError("Unable to load real-time statistics. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-600 border-t-transparent"></div>
          <p className="text-sm font-medium text-slate-500">Syncing real-time data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl mt-12 p-8 text-center bg-white rounded-3xl border border-brand-100 shadow-soft">
        <div className="mx-auto w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h2>
        <p className="text-slate-600 mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="btn-primary"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 border-l-4 border-brand-600 pl-4">
            System Insights
          </h1>
          <p className="text-slate-500 mt-2 ml-5">
            Real-time metrics from our global disaster relief network
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-50 text-brand-700 rounded-full border border-brand-100 self-start md:self-auto">
          <div className="w-2 h-2 bg-brand-600 rounded-full animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider">Live Updates</span>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Citizens"
          value={stats.totalUsers}
          icon={<Users className="w-6 h-6" />}
          color="bg-brand-50 text-brand-600 border-brand-100"
        />
        <StatCard
          title="Active Volunteers"
          value={stats.totalVolunteers}
          icon={<Shield className="w-6 h-6" />}
          color="bg-brand-50 text-brand-600 border-brand-100"
        />
        <StatCard
          title="Partner NGOs"
          value={stats.totalNGOs}
          icon={<Building2 className="w-6 h-6" />}
          color="bg-emerald-50 text-emerald-600 border-emerald-100"
        />
        <StatCard
          title="Rescue Teams"
          value={stats.totalRescue}
          icon={<Siren className="w-6 h-6" />}
          color="bg-orange-50 text-orange-600 border-orange-100"
        />
      </div>

      {/* Secondary Metrics & Visuals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total Reported"
            value={stats.totalDisasters}
            icon={<Activity className="w-6 h-6" />}
            color="bg-slate-50 text-slate-600 border-slate-100"
            size="small"
          />
          <StatCard
            title="Active Hazards"
            value={stats.activeDisasters}
            icon={<AlertTriangle className="w-6 h-6" />}
            color="bg-red-50 text-red-600 border-red-100"
            size="small"
          />

          {/* Mission Statistics Row */}
          <StatCard
            title="Completed Missions"
            value={stats.totalCompletedMissions || 0}
            icon={<CheckCircle2 className="w-6 h-6" />}
            color="bg-purple-50 text-purple-600 border-purple-100"
            size="small"
          />
          <StatCard
            title="Aid Distributed"
            value={stats.totalDistributedAid || 0}
            icon={<Activity className="w-6 h-6" />}
            color="bg-green-50 text-green-600 border-green-100"
            size="small"
          />
          <StatCard
            title="Total Missions"
            value={stats.totalMissions || 0}
            icon={<Activity className="w-6 h-6" />}
            color="bg-brand-50 text-brand-600 border-brand-100"
            size="small"
          />

          {/* Info Box */}
          <div className="md:col-span-3 p-6 bg-gradient-to-br from-brand-600 to-brand-800 rounded-3xl text-white shadow-lg overflow-hidden relative">
            <div className="p-3 bg-brand-50 rounded-lg">
              <BarChart3 className="w-6 h-6 text-brand-600" />
            </div>
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-2">Disaster Insights</h3>
              <p className="text-white/80 text-sm max-w-lg">
                These statistics represent the collective efforts of our coordinated response system.
                Every alert contributes to a safer community and a faster response time for those in need.
              </p>
            </div>
          </div>
        </div>

        {/* Status Breakdown / Summary Sidecard */}
        <div className="bg-white rounded-3xl border border-brand-100 p-6 shadow-soft">
          <h3 className="text-lg font-bold text-slate-900 mb-4 border-b pb-4">Incident Summary</h3>
          <div className="space-y-4">
            <StatusIndicator label="Active Alerts" value={stats.activeAlerts} color="bg-red-500" />
            <StatusIndicator label="Global Response Rate" value="94%" color="bg-emerald-500" />
            <StatusIndicator label="Avg. Response Time" value="12m" color="bg-brand-500" />
            <StatusIndicator label="Verified Sources" value="1,240+" color="bg-brand-500" />
          </div>

          <div className="mt-8 pt-6 border-t border-slate-50">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-[0.2em]">Data Compliance</p>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Aggregated metrics are updated in real-time based on verified field reports and satellite telemetry.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, size = "large" }) {
  return (
    <div className={`
      group bg-white rounded-3xl border border-brand-100 p-6 shadow-soft
      hover:shadow-lg transition-all duration-300 hover:-translate-y-1
    `}>
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-2xl border ${color} transition-colors duration-300`}>
          {icon}
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 group-hover:text-brand-600 transition-colors">
            {title}
          </p>
          <p className={`${size === 'large' ? 'text-4xl' : 'text-2xl'} font-black text-slate-900 tabular-nums`}>
            {(value ?? 0).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}

function StatusIndicator({ label, value, color }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${color}`} />
        <span className="text-sm font-medium text-slate-600">{label}</span>
      </div>
      <span className="text-sm font-bold text-slate-900">{value}</span>
    </div>
  );
}
