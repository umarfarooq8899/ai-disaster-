import React, { useEffect, useState } from "react";

export default function ManageAlerts() {
  const [alerts, setAlerts] = useState([]);

  // TEMP data (API later)
  useEffect(() => {
    setAlerts([
      {
        id: 1,
        title: "Flood Warning",
        type: "Emergency",
        target: "Karachi",
        status: "Active",
        createdAt: "22 Aug 2025",
      },
      {
        id: 2,
        title: "Heatwave Alert",
        type: "Weather",
        target: "All Users",
        status: "Disabled",
        createdAt: "18 Aug 2025",
      },
    ]);
  }, []);

  return (
    <div className="p-6 space-y-4">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Manage Alerts</h1>

        <button className="px-4 py-2 bg-blue-600 text-white rounded">
          + Create Alert
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Title</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Target</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Created</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {alerts.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="p-3">{a.title}</td>
                <td className="p-3">{a.type}</td>
                <td className="p-3">{a.target}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      a.status === "Active"
                        ? "bg-green-100 text-green-600"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {a.status}
                  </span>
                </td>
                <td className="p-3">{a.createdAt}</td>
                <td className="p-3 flex gap-2">
                  <button className="text-blue-600">Edit</button>
                  <button className="text-yellow-600">
                    {a.status === "Active" ? "Disable" : "Enable"}
                  </button>
                  <button className="text-red-600">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
