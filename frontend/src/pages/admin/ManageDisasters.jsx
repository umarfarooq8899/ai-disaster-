import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";

export default function ManageDisasters() {
  const { user, token } = useContext(AuthContext);
  const [disasters, setDisasters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDisasters = async () => {
    setLoading(true);
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
    await axios.patch(
      `http://localhost:5000/api/disasters/${id}/resolve`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    fetchDisasters();
  };

  const deleteDisaster = async (id) => {
    await axios.delete(`http://localhost:5000/api/disasters/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchDisasters();
  };

  useEffect(() => {
    if (user?.role === "admin") fetchDisasters();
  }, [user]);

  if (loading) return <div className="p-6">Loading disasters...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Manage Disasters</h1>
      <div className="overflow-x-auto bg-white shadow rounded">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">Type</th>
              <th className="p-3">Location</th>
              <th className="p-3">Severity</th>
              <th className="p-3">Status</th>
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
                <td className="p-3 flex gap-2">
                  <button className="btn-outline" onClick={() => resolveDisaster(d._id)}>
                    Resolve
                  </button>
                  <button className="btn-danger" onClick={() => deleteDisaster(d._id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
