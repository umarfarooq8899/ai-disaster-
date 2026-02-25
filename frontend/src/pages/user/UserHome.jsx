import React, { useEffect, useState } from "react";
import MapView from "../../components/map/MapView";
import { getAllDisasters } from "../../api/disasters";
import { zones, volunteers } from "../../utils/mockData";
import { Link } from "react-router-dom";
import { Bell, User, BarChart3 } from "lucide-react";

export default function UserHome() {
  const [disasters, setDisasters] = useState([]);

  useEffect(() => {
    getAllDisasters()
      .then(setDisasters)
      .catch(() => setDisasters([]));
  }, []);

  return (
    <div className="space-y-8">

      {/* TOP DASHBOARD CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <Link
          to="/alerts"
          className="group bg-white rounded-2xl p-6 shadow-sm border hover:shadow-lg hover:-translate-y-1 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition">
              <Bell size={22} />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Alerts & Actions</h3>
              <p className="text-sm text-gray-500">
                Latest alerts and quick response options.
              </p>
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
              <p className="text-sm text-gray-500">
                Manage personal and contact details.
              </p>
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
              <p className="text-sm text-gray-500">
                Disaster trends and severity insights.
              </p>
            </div>
          </div>
        </Link>

      </div>

      {/* LIVE MAP */}
      <div>
        <h3 className="font-semibold text-lg mb-3">Live Map</h3>
        <div className="rounded-2xl overflow-hidden border shadow-sm">
          <MapView disasters={disasters} zones={zones} volunteers={volunteers} />
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex gap-4">
        <Link
          to="/dashboard/user/reports"
          className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
        >
          My Reports
        </Link>
        <Link
          to="/report"
          className="px-5 py-2.5 border rounded-xl hover:bg-gray-100 transition"
        >
          Report Disaster
        </Link>
      </div>

    </div>
  );
}
