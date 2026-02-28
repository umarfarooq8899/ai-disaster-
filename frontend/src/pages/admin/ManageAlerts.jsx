// src/pages/admin/ManageAlerts.jsx
import React, { useEffect, useState, useContext } from "react";
import api from "../../api/axios"; // Use configured axios
import { AuthContext } from "../../context/AuthContext";
import { Bell, Power, Trash2 } from "lucide-react";

export default function ManageAlerts() {
  const { token } = useContext(AuthContext);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/admin/alerts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAlerts(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load alerts");
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id, status) => {
    try {
      await api.patch(
        `/admin/alerts/${id}/status`,
        { status: status === "Active" ? "Disabled" : "Active" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchAlerts();
    } catch (err) {
      console.error(err);
      setError("Failed to change alert status");
    }
  };

  const deleteAlert = async (id) => {
    try {
      await api.delete(`/admin/alerts/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAlerts();
    } catch (err) {
      console.error(err);
      setError("Failed to delete alert");
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  if (loading) return <SkeletonTable />;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
          <Bell className="w-5 h-5 text-gray-600" />
          Manage Alerts
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Enable, disable or remove system alerts
        </p>
      </header>

      {/* TABLE */}
      <div className="overflow-x-auto bg-white border border-gray-200 rounded-xl shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="p-4">Title</th>
              <th className="p-4">Type</th>
              <th className="p-4">Target</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((a) => (
              <tr
                key={a._id}
                className="border-t hover:bg-gray-50 transition"
              >
                <td className="p-4 font-medium text-gray-800">
                  {a.title}
                </td>
                <td className="p-4 text-gray-600">{a.type}</td>
                <td className="p-4 text-gray-600">{a.target}</td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${a.status === "Active"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-200 text-gray-600"
                      }`}
                  >
                    {a.status}
                  </span>
                </td>
                <td className="p-4 flex justify-end gap-2">
                  <button
                    onClick={() => toggleStatus(a._id, a.status)}
                    className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border transition ${a.status === "Active"
                      ? "border-orange-300 text-orange-600 hover:bg-orange-50"
                      : "border-green-300 text-green-600 hover:bg-green-50"
                      }`}
                  >
                    <Power className="w-4 h-4" />
                    {a.status === "Active" ? "Disable" : "Enable"}
                  </button>

                  <button
                    onClick={() => deleteAlert(a._id)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {alerts.length === 0 && (
              <tr>
                <td
                  colSpan="5"
                  className="p-6 text-center text-gray-500"
                >
                  No alerts found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ===============================
   SKELETON TABLE
================================ */
function SkeletonTable() {
  return (
    <div className="p-8 bg-gray-50 min-h-screen animate-pulse">
      <div className="h-6 w-40 bg-gray-200 rounded mb-6" />
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex justify-between">
            <div className="h-4 w-48 bg-gray-200 rounded" />
            <div className="h-4 w-24 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
