import React, { useEffect, useState } from "react";
import { getDisasters, resolveDisaster, deleteDisaster } from "../../api/admin";
import { useNavigate } from "react-router-dom";

export default function ManageDisasters() {
  const [disasters, setDisasters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchDisasters = async () => {
    try {
      const res = await getDisasters();
      setDisasters(res.data);
    } catch (err) {
      console.error(err);
      setError("Unauthorized. Redirecting...");
      localStorage.removeItem("token");
      setTimeout(() => navigate("/admin/login"), 2000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => fetchDisasters(), []);

  const handleResolve = async (id) => {
    await resolveDisaster(id);
    fetchDisasters();
  };

  const handleDelete = async (id) => {
    await deleteDisaster(id);
    fetchDisasters();
  };

  if (loading) return <div className="p-6">Loading disasters...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Manage Disasters</h1>
      <table className="w-full text-sm bg-white shadow rounded overflow-x-auto">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3">Type</th>
            <th className="p-3">Location</th>
            <th className="p-3">Severity</th>
            <th className="p-3">Status</th>
            <th className="p-3">Reported By</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {disasters.map((d) => (
            <tr key={d._id} className="border-t">
              <td className="p-3">{d.type}</td>
              <td className="p-3">{d.location}</td>
              <td className="p-3">{d.severity}</td>
              <td className="p-3">{d.status}</td>
              <td className="p-3">{d.reportedBy}</td>
              <td className="p-3 flex gap-2">
                <button onClick={() => handleResolve(d._id)}>Resolve</button>
                <button onClick={() => handleDelete(d._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
