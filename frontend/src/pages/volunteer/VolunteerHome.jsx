import React from "react";
import { Link } from "react-router-dom";

export default function VolunteerHome() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold">Volunteer Dashboard</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        <div className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition">
          <h3 className="text-lg font-semibold mb-2">Assigned Tasks</h3>
          <p className="text-3xl font-bold text-brand-700">5</p>
          <Link to="/dashboard/volunteer/tasks" className="text-sm text-brand-600 hover:underline mt-2 block">
            View Tasks
          </Link>
        </div>

        <div className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition">
          <h3 className="text-lg font-semibold mb-2">Nearby Alerts</h3>
          <p className="text-3xl font-bold text-red-600">3</p>
          <Link to="/dashboard/volunteer/nearby" className="text-sm text-red-600 hover:underline mt-2 block">
            View Alerts
          </Link>
        </div>

        <div className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition">
          <h3 className="text-lg font-semibold mb-2">Availability Status</h3>
          <p className="text-3xl font-bold text-green-600">Active</p>
          <Link to="/dashboard/volunteer/profile" className="text-sm text-green-600 hover:underline mt-2 block">
            Update Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
