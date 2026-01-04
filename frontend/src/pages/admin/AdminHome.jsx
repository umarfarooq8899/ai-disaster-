// src/pages/admin/AdminHome.jsx
import React from "react";
import Statistics from "../../pages/components/Statistics";

export default function AdminHome() {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-extrabold text-slate-900 mb-6">
        Admin Dashboard
      </h1>

      {/* Embed existing statistics component */}
      <Statistics />

      {/* Quick access cards for admin actions */}
      <div className="grid gap-6 sm:grid-cols-3 lg:grid-cols-4 mt-6">
        <a
          href="/dashboard/admin/users"
          className="p-4 bg-white shadow rounded hover:bg-indigo-50"
        >
          Manage Users
        </a>
        <a
          href="/dashboard/admin/disasters"
          className="p-4 bg-white shadow rounded hover:bg-green-50"
        >
          Manage Disasters
        </a>
        <a
          href="/dashboard/admin/alerts"
          className="p-4 bg-white shadow rounded hover:bg-red-50"
        >
          Manage Alerts
        </a>
      </div>
    </div>
  );
}
