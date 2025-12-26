import React from "react";
import { Link } from "react-router-dom";
import { Users, AlertCircle, Zap, MapPin } from "lucide-react";

export default function AdminHome() {
  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
      {/* PAGE TITLE */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-600 mt-1">Overview and administrative controls</p>
      </div>

      {/* STATS CARDS */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-start hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center space-x-3 text-slate-500">
            <Users className="w-6 h-6 text-indigo-500" />
            <span className="text-sm">Total Users</span>
          </div>
          <div className="text-3xl font-bold mt-3">—</div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-start hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center space-x-3 text-slate-500">
            <MapPin className="w-6 h-6 text-green-500" />
            <span className="text-sm">Disasters</span>
          </div>
          <div className="text-3xl font-bold mt-3">—</div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-start hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center space-x-3 text-slate-500">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <span className="text-sm">Active Alerts</span>
          </div>
          <div className="text-3xl font-bold mt-3">—</div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-start hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center space-x-3 text-slate-500">
            <Zap className="w-6 h-6 text-yellow-500" />
            <span className="text-sm">Volunteers</span>
          </div>
          <div className="text-3xl font-bold mt-3">—</div>
        </div>
      </div>

      {/* ACTION CARDS */}
      <div className="grid gap-6 md:grid-cols-3">
        <Link
          to="/dashboard/admin/users"
          className="bg-white border border-slate-200 rounded-xl p-6 shadow hover:shadow-lg transition-shadow duration-300"
        >
          <h3 className="font-bold text-lg text-slate-900">Manage Users</h3>
          <p className="text-sm text-slate-500 mt-2">
            View and control platform users
          </p>
        </Link>

        <Link
          to="/dashboard/admin/disasters"
          className="bg-white border border-slate-200 rounded-xl p-6 shadow hover:shadow-lg transition-shadow duration-300"
        >
          <h3 className="font-bold text-lg text-slate-900">Manage Disasters</h3>
          <p className="text-sm text-slate-500 mt-2">
            Verify and resolve disaster reports
          </p>
        </Link>

        <Link
          to="/dashboard/admin/alerts"
          className="bg-white border border-slate-200 rounded-xl p-6 shadow hover:shadow-lg transition-shadow duration-300"
        >
          <h3 className="font-bold text-lg text-slate-900">Manage Alerts</h3>
          <p className="text-sm text-slate-500 mt-2">
            Create and update emergency alerts
          </p>
        </Link>
      </div>
    </div>
  );
}
