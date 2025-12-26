import React, { useEffect, useState } from "react";

export default function ManageDisasters() {
  const [disasters, setDisasters] = useState([]);

  // TEMP mock data (backend later)
  useEffect(() => {
    setDisasters([
      {
        id: 1,
        type: "Flood",
        location: "Karachi",
        severity: "High",
        status: "Active",
        reportedBy: "Umar",
      },
      {
        id: 2,
        type: "Earthquake",
        location: "Quetta",
        severity: "Medium",
        status: "Resolved",
        reportedBy: "Ali",
      },
    ]);
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Manage Disasters</h1>

      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Location</th>
              <th className="p-3 text-left">Severity</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Reported By</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {disasters.map((d) => (
              <tr key={d.id} className="border-t">
                <td className="p-3">{d.type}</td>
                <td className="p-3">{d.location}</td>
                <td className="p-3">{d.severity}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      d.status === "Active"
                        ? "bg-red-100 text-red-600"
                        : "bg-green-100 text-green-600"
                    }`}
                  >
                    {d.status}
                  </span>
                </td>
                <td className="p-3">{d.reportedBy}</td>
                <td className="p-3 flex gap-2">
                  <button className="text-blue-600">View</button>
                  <button className="text-green-600">Resolve</button>
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
