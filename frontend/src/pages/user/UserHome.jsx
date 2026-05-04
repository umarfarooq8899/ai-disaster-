import React, { useEffect, useState, useCallback } from "react";
import MapView from "../../components/map/MapView";
import { getAllDisasters } from "../../api/disasters";
import { Link } from "react-router-dom";
import axios from "../../api/axios";
import { Bell, User, BarChart3, ShieldCheck, BrainCircuit, Activity, Clock } from "lucide-react";

const POLL_INTERVAL_MS = 30_000;

export default function UserHome() {
  const [disasters, setDisasters] = useState([]);
  const [activities, setActivities] = useState([]);
  const [mapLoading, setMapLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [disastersData, activityRes] = await Promise.all([
        getAllDisasters(),
        axios.get("/statistics/public/activity")
      ]);
      setDisasters(disastersData);
      setActivities(activityRes.data);
      setMapLoading(false);
    } catch (err) {
      console.error("Failed to fetch user dashboard data", err);
      setMapLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [fetchData]);

  return (
    <div className="space-y-10 p-4 lg:p-8">
      
      {/* HERO / WELCOME */}
      <header className="space-y-2">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">AI Disaster Response</h1>
        <p className="text-slate-500 font-medium">Real-time monitoring and emergency assistance platform.</p>
      </header>

      {/* TOP DASHBOARD CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        <Link
          to="/alerts"
          className="group bg-white rounded-3xl p-6 shadow-sm border hover:shadow-xl hover:-translate-y-1 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white transition-all shadow-sm">
              <Bell className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-lg text-slate-800">Emergency Alerts</h3>
              <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Live Updates</p>
            </div>
          </div>
        </Link>

        <Link
          to="/profile"
          className="group bg-white rounded-3xl p-6 shadow-sm border hover:shadow-xl hover:-translate-y-1 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-all shadow-sm">
              <User size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800">My Profile</h3>
              <p className="text-[10px] font-black text-brand-500 uppercase tracking-widest">Manage Account</p>
            </div>
          </div>
        </Link>

        <Link
          to="/statistics"
          className="group bg-white rounded-3xl p-6 shadow-sm border hover:shadow-xl hover:-translate-y-1 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-sm">
              <BarChart3 size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800">Statistics</h3>
              <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest">Global Trends</p>
            </div>
          </div>
        </Link>

        <Link
          to="/dashboard/user/ai-analysis"
          className="group bg-white rounded-3xl p-6 shadow-sm border hover:shadow-xl hover:-translate-y-1 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
              <BrainCircuit size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800">AI Analysis</h3>
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Predictions</p>
            </div>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LIVE MAP (2 COLS) */}
        <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <h3 className="font-black text-xl text-slate-900 tracking-tight">Active Disasters Map</h3>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Updates every 30s</span>
            </div>
            <div className="rounded-3xl overflow-hidden border-2 border-white shadow-soft relative group" style={{ height: "480px" }}>
              {mapLoading ? (
                <div className="h-full animate-pulse bg-slate-100 flex flex-col items-center justify-center text-slate-400 text-sm">
                  <RefreshCw className="w-8 h-8 mb-4 animate-spin opacity-20" />
                  Initializating Map...
                </div>
              ) : (
                <MapView disasters={disasters} height="480px" />
              )}
              
              {/* Report Button Floating on Map */}
              <div className="absolute bottom-6 left-6 right-6 flex gap-3">
                  <Link to="/report" className="flex-1 bg-brand-600 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-brand-700 transition-all text-center flex items-center justify-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Report Emergency
                  </Link>
                  <Link to="/dashboard/user/reports" className="px-6 bg-white/90 backdrop-blur-sm text-slate-900 font-bold rounded-2xl shadow-xl hover:bg-white transition-all flex items-center justify-center">
                    History
                  </Link>
              </div>
            </div>
        </div>

        {/* RECENT ACTIVITY (1 COL) */}
        <div className="space-y-4 flex flex-col">
            <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-brand-600" />
                <h3 className="font-black text-xl text-slate-900 tracking-tight">Relief Activity</h3>
            </div>
            <div className="bg-white rounded-3xl border shadow-sm overflow-hidden flex flex-col" style={{ height: "480px" }}>
                <div className="p-6 border-b bg-slate-50/50">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Global Operations Feed</p>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {activities.length === 0 ? (
                        <div className="py-12 text-center">
                            <Activity className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                            <p className="text-sm text-slate-400 font-medium italic">No recent activity recorded.</p>
                        </div>
                    ) : (
                        activities.map((log) => (
                            <div key={log._id} className="relative pl-6 border-l-2 border-slate-100 pb-1 last:pb-0 group">
                                <div className="absolute -left-[9px] top-0 w-4 h-4 bg-white border-2 border-slate-200 rounded-full group-hover:border-brand-500 transition-colors" />
                                <div className="mb-1 flex items-center justify-between">
                                    <span className="text-[10px] font-black text-brand-600 uppercase tracking-tighter">
                                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{log.disaster?.title || 'Relief Update'}</h4>
                                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mt-1">{log.description}</p>
                            </div>
                        ))
                    )}
                </div>
                <div className="p-6 border-t bg-slate-50/30">
                    <Link to="/statistics" className="block text-center text-xs font-black text-brand-600 hover:underline uppercase tracking-tight">
                        View Detailed Insights
                    </Link>
                </div>
            </div>
        </div>
      </div>

    </div>
  );
}

function RefreshCw({ className }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M8 16H3v5"></path></svg>
    )
}

function AlertTriangle({ className }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>
    )
}
