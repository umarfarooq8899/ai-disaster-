import React, { useEffect, useState } from "react";
import { getAlerts, changeAlertStatus, deleteAlert } from "../../api/admin";
import { useNavigate } from "react-router-dom";

export default function ManageAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchAlerts = async () => {
    try {
      const res = await getAlerts();
      setAlerts(res.data);
    } catch (err) {
      console.error(err);
      setError("Unauthorized. Redirecting...");
      localStorage.removeItem("token");
      setTimeout(() => navigate("/admin/login"), 2000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => fetchAlerts(), []);

  const handleToggle = async (id, status) => {
    await changeAlertStatus(id, status === "Active" ? "Disabled" : "Active");
    fetchAlerts();
  };

  const handleDelete = async (id) => {
    await deleteAlert(id);
    fetchAlerts();
  };

  if (loading) return <div className="p-6">Loading alerts...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Manage Alerts</h1>
      <table className="w-full text-sm bg-white shadow rounded overflow-x-auto">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3">Title</th>
            <th className="p-3">Type</th>
            <th className="p-3">Target</th>
            <th className="p-3">Status</th>
            <th className="p-3">Created</th>
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
              <td className="p-3">{new Date(a.createdAt).toLocaleDateString()}</td>
              <td className="p-3 flex gap-2">
                <button onClick={() => handleToggle(a._id, a.status)}>
                  {a.status === "Active" ? "Disable" : "Enable"}
                </button>
                <button onClick={() => handleDelete(a._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
