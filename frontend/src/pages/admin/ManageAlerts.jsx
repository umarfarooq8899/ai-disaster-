// src/pages/admin/ManageAlerts.jsx
import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";

export default function ManageAlerts() {
  const { token } = useContext(AuthContext); // use token from AuthContext
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get("http://localhost:5000/api/alerts", {
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
      await axios.patch(
        `http://localhost:5000/api/alerts/${id}/status`,
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
      await axios.delete(`http://localhost:5000/api/alerts/${id}`, {
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

  if (loading) return <div className="p-6">Loading alerts...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Manage Alerts</h1>
      <table className="w-full text-left text-sm bg-white shadow rounded overflow-x-auto">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3">Title</th>
            <th className="p-3">Type</th>
            <th className="p-3">Target</th>
            <th className="p-3">Status</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {alerts.map((a) => (
            <tr key={a._id} className="border-t">
              <td className="p-3">{a.title}</td>
              <td className="p-3">{a.type}</td>
              <td className="p-3">{a.target}</td>
              <td className="p-3">{a.status}</td>
              <td className="p-3 flex gap-2">
                <button
                  onClick={() => toggleStatus(a._id, a.status)}
                  className="btn-outline"
                >
                  {a.status === "Active" ? "Disable" : "Enable"}
                </button>
                <button onClick={() => deleteAlert(a._id)} className="btn-outline">
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
