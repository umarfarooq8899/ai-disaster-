import React, { useEffect, useState } from "react";
import { getAllDisasters } from "../../api/disasters";
import {
  FaExclamationTriangle,
  FaMapMarkerAlt,
  FaClipboardList,
} from "react-icons/fa";

export default function MyReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllDisasters()
      .then((data) => setReports(data))
      .finally(() => setLoading(false));
  }, []);

  /* ---------- Skeleton Loader ---------- */
  if (loading) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">My Reports</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse bg-gray-100 p-4 rounded-lg shadow"
            >
              <div className="h-4 bg-gray-300 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-300 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <FaClipboardList className="text-blue-600 text-xl" />
        <h2 className="text-xl font-semibold">My Reports</h2>
      </div>

      {/* Empty State */}
      {reports.length === 0 && (
        <div className="bg-blue-50 text-blue-700 p-4 rounded-lg">
          No reports submitted yet.
        </div>
      )}

      {/* Reports List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((r) => (
          <div
            key={r._id || r.id}
            className="bg-white p-4 rounded-lg shadow hover:shadow-md transition"
          >
            {/* Title + Severity */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 font-semibold">
                <FaExclamationTriangle className="text-yellow-500" />
                {r.type}
              </div>

              <span
                className={`text-xs px-2 py-1 rounded-full font-medium
                  ${
                    r.severity === "High"
                      ? "bg-red-100 text-red-700"
                      : r.severity === "Medium"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-green-100 text-green-700"
                  }
                `}
              >
                {r.severity || "Low"}
              </span>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 mb-3">
              {r.description || "No description provided"}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-gray-500">
                <FaMapMarkerAlt />
                {r.location || "Unknown location"}
              </div>

              <span
                className={`px-2 py-1 rounded-full
                  ${
                    r.status === "Resolved"
                      ? "bg-green-100 text-green-700"
                      : "bg-blue-100 text-blue-700"
                  }
                `}
              >
                {r.status || "Reported"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
