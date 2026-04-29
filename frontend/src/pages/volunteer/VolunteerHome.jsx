import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../../api/axios";
import { Activity, Clock } from "lucide-react";

export default function VolunteerHome() {
  const [stats, setStats] = useState({
    assignedTasks: 0,
    nearbyAlerts: 0,
    isAvailable: false,
    tasksCompleted: 0,
  });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, activityRes] = await Promise.all([
          axiosInstance.get("/volunteer/stats"),
          axiosInstance.get("/volunteer/activity")
        ]);
        setStats(statsRes.data);
        setActivities(activityRes.data);
      } catch (err) {
        console.error("Failed to fetch volunteer data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div className="p-6">Loading dashboard...</div>;

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Volunteer Dashboard</h2>
        <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${stats.isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
            <span className="text-sm font-bold text-slate-500">{stats.isAvailable ? 'Available for Deployment' : 'On Mission / Offline'}</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border hover:shadow-md transition group">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Assigned Tasks</h3>
          <div className="flex items-end justify-between">
            <p className="text-4xl font-black text-brand-700">{stats.assignedTasks}</p>
            <Link to="/dashboard/volunteer/tasks" className="text-xs font-bold text-brand-600 bg-brand-50 px-3 py-1.5 rounded-lg group-hover:bg-brand-600 group-hover:text-white transition-all">
                View Tasks
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border hover:shadow-md transition group">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Nearby Alerts</h3>
          <div className="flex items-end justify-between">
            <p className="text-4xl font-black text-red-600">{stats.nearbyAlerts}</p>
            <Link to="/dashboard/volunteer/nearby" className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg group-hover:bg-red-600 group-hover:text-white transition-all">
                Check Area
            </Link>
          </div>
        </div>

        {/* Impact Profile Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border hover:shadow-md transition flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Impact Profile</h3>
            <p className="text-4xl font-black text-emerald-600">{stats.tasksCompleted}</p>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tight">Missions Successfully Completed</p>
          </div>

          <div className="mt-4 flex items-center justify-between">
            {stats.tasksCompleted >= 10 ? (
              <div className="bg-gradient-to-r from-amber-400 to-amber-600 text-white text-[10px] font-black px-3 py-1.5 rounded-lg inline-flex items-center gap-1 shadow-sm uppercase">
                🏆 Veteran Responder
              </div>
            ) : stats.tasksCompleted >= 5 ? (
              <div className="bg-gradient-to-r from-slate-400 to-slate-500 text-white text-[10px] font-black px-3 py-1.5 rounded-lg inline-flex items-center gap-1 shadow-sm uppercase">
                🥈 Experienced Volunteer
              </div>
            ) : stats.tasksCompleted >= 1 ? (
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-black px-3 py-1.5 rounded-lg inline-flex items-center gap-1 shadow-sm uppercase">
                🥉 First Responder
              </div>
            ) : (
              <div className="bg-slate-100 text-slate-500 text-[10px] font-black px-3 py-1.5 rounded-lg inline-flex items-center gap-1 uppercase">
                New Recruit
              </div>
            )}
            <Link to="/dashboard/volunteer/history" className="text-[10px] font-black text-emerald-600 hover:underline uppercase tracking-tight">
                Full History
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
        <div className="p-6 border-b bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-brand-600" />
                <h3 className="font-black text-slate-800 tracking-tight">Recent Task Activity</h3>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Updates on your missions</span>
        </div>
        <div className="p-6">
            {activities.length === 0 ? (
                <div className="py-12 text-center">
                    <Activity className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-sm text-slate-400 font-medium italic">No recent activity on your assigned tasks.</p>
                    <p className="text-xs text-slate-300 mt-1">Start by accepting a mission from the tasks page!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {activities.map((log) => (
                        <div key={log._id} className="flex gap-4 p-4 rounded-2xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100 group">
                            <div className="mt-1 p-2.5 rounded-xl bg-brand-50 text-brand-600 group-hover:bg-white group-hover:shadow-sm transition-all h-fit">
                                <Activity className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className="text-sm font-bold text-slate-800">{log.disaster?.title || 'Relief Operation'}</h4>
                                    <span className="text-[10px] text-slate-400 font-bold">{new Date(log.createdAt).toLocaleDateString()}</span>
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed mb-2">{log.description}</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-black bg-white border border-slate-100 text-slate-500 px-2 py-0.5 rounded-lg uppercase tracking-tight shadow-sm">
                                        {log.updateType.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
        <div className="p-4 border-t bg-slate-50/30 text-center">
            <Link to="/dashboard/volunteer/history" className="text-xs font-bold text-brand-600 hover:text-brand-700 transition">
                View all history →
            </Link>
        </div>
      </div>
    </div>
  );
}
