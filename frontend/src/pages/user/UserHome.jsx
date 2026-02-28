import React, { useEffect, useState, useCallback } from "react";
import MapView from "../../components/map/MapView";
import { getAllDisasters } from "../../api/disasters";
import { Link } from "react-router-dom";
import { Bell, User, BarChart3, ShieldCheck, BrainCircuit } from "lucide-react";

const POLL_INTERVAL_MS = 30_000;

export default function UserHome() {
  const [disasters, setDisasters] = useState([]);
  const [mapLoading, setMapLoading] = useState(true);

  const fetchDisasters = useCallback(() => {
    getAllDisasters()
      .then((data) => {
        setDisasters(data);
        setMapLoading(false);
      })
      .catch(() => {
        setDisasters([]);
        setMapLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchDisasters();
    const timer = setInterval(fetchDisasters, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [fetchDisasters]);

  return (
    <div className="space-y-8">

      {/* TOP DASHBOARD CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        <Link
          to="/alerts"
          className="group bg-white rounded-2xl p-6 shadow-sm border hover:shadow-lg hover:-translate-y-1 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-brand-50 text-brand-600 group-hover:bg-brand-100 transition">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-lg">Emergency Alerts</h3>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status: Secure</p>
            </div>
          </div>
        </Link>

        <Link
          to="/profile"
          className="group bg-white rounded-2xl p-6 shadow-sm border hover:shadow-lg hover:-translate-y-1 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-50 text-green-600 group-hover:bg-green-100 transition">
              <User size={22} />
            </div>
            <div>
              <h3 className="font-semibold text-lg">My Profile</h3>
              <p className="text-sm text-gray-500">Manage personal and contact details.</p>
            </div>
          </div>
        </Link>

        <Link
          to="/statistics"
          className="group bg-white rounded-2xl p-6 shadow-sm border hover:shadow-lg hover:-translate-y-1 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-100 transition">
              <BarChart3 size={22} />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Statistics</h3>
              <p className="text-sm text-gray-500">Disaster trends and severity insights.</p>
            </div>
          </div>
        </Link>

        <Link
          to="/dashboard/user/ai-analysis"
          className="group bg-white rounded-2xl p-6 shadow-sm border hover:shadow-lg hover:-translate-y-1 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition">
              <BrainCircuit size={22} />
            </div>
            <div>
              <h3 className="font-semibold text-lg">AI Analysis</h3>
              <p className="text-sm text-gray-500">Predict and detect disasters using AI.</p>
            </div>
          </div>
        </Link>
      </div>

      {/* LIVE MAP */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-lg">Live Map</h3>
          <span className="text-xs text-slate-400">Auto-refreshes every 30 s</span>
        </div>
        <div className="rounded-2xl overflow-hidden border shadow-sm" style={{ height: "420px" }}>
          {mapLoading ? (
            <div className="h-full animate-pulse bg-slate-100 flex items-center justify-center text-slate-400 text-sm">
              Loading map…
            </div>
          ) : (
            <MapView disasters={disasters} height="420px" />
          )}
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex gap-4">
        <Link to="/dashboard/user/reports" className="px-5 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition">
          My Reports
        </Link>
        <Link to="/report" className="px-5 py-2.5 border rounded-xl hover:bg-gray-100 transition">
          Report Disaster
        </Link>
        <Link to="/dashboard/user/ai-analysis" className="px-5 py-2.5 border rounded-xl hover:bg-gray-100 transition">
          AI Analysis
        </Link>
      </div>

    </div>
  );
}
