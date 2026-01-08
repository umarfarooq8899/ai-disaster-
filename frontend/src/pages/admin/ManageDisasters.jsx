// src/pages/admin/ManageDisasters.jsx
import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { AlertTriangle, CheckCircle, Trash2, MapPin } from "lucide-react";

export default function ManageDisasters() {
  const { user, token } = useContext(AuthContext);
  const [disasters, setDisasters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDisasters = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get("http://localhost:5000/api/disasters", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDisasters(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load disasters");
    } finally {
      setLoading(false);
    }
  };

  const resolveDisaster = async (id) => {
    try {
      await axios.patch(
        `http://localhost:5000/api/disasters/${id}/resolve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchDisasters();
    } catch (err) {
      console.error(err);
      setError("Failed to resolve disaster");
    }
  };

  const deleteDisaster = async (id) => {
    try {
      await axios.delete(
        `http://localhost:5000/api/disasters/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchDisasters();
    } catch (err) {
      console.error(err);
      setError("Failed to delete disaster");
    }
  };

  useEffect(() => {
    if (user?.role === "admin") fetchDisasters();
  }, [user]);

  if (loading) return <SkeletonTable />;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-gray-600" />
          Manage Disasters
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Monitor, resolve or remove disaster reports
        </p>
      </header>

      {/* TABLE */}
      <div className="overflow-x-auto bg-white border border-gray-200 rounded-xl shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="p-4">Type</th>
              <th className="p-4">Location</th>
              <th className="p-4">Severity</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {disasters.map((d) => (
              <tr
                key={d._id}
                className="border-t hover:bg-gray-50 transition"
              >
                <td className="p-4 font-medium text-gray-800">
                  {d.type}
                </td>

                <td className="p-4 text-gray-600 flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {d.location}
                </td>

                <td className="p-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      d.severity === "High"
                        ? "bg-red-100 text-red-700"
                        : d.severity === "Medium"
                        ? "bg-orange-100 text-orange-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {d.severity}
                  </span>
                </td>

                <td className="p-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      d.status === "Active"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {d.status}
                  </span>
                </td>

                <td className="p-4 flex justify-end gap-2">
                  {d.status === "Active" && (
                    <button
                      onClick={() => resolveDisaster(d._id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-green-300 text-green-600 hover:bg-green-50 transition"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Resolve
                    </button>
                  )}

                  <button
                    onClick={() => deleteDisaster(d._id)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {disasters.length === 0 && (
              <tr>
                <td
                  colSpan="5"
                  className="p-6 text-center text-gray-500"
                >
                  No disasters found
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
      <div className="h-6 w-48 bg-gray-200 rounded mb-6" />
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex justify-between">
            <div className="h-4 w-40 bg-gray-200 rounded" />
            <div className="h-4 w-24 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
