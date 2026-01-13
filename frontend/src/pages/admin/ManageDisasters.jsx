// src/pages/admin/ManageDisasters.jsx
import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { AuthContext } from "../../context/AuthContext";
import {
  AlertTriangle,
  CheckCircle,
  Trash2,
  MapPin,
  X,
} from "lucide-react";

export default function ManageDisasters() {
  const { user, token } = useContext(AuthContext);

  const [disasters, setDisasters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedDisaster, setSelectedDisaster] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchDisasters = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/disasters", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDisasters(res.data);
    } catch {
      toast.error("Failed to load disasters");
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
      toast.success("Disaster resolved");
      fetchDisasters();
    } catch {
      toast.error("Failed to resolve disaster");
    }
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(
        `http://localhost:5000/api/disasters/${deleteTarget}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Disaster deleted successfully");
      setDeleteTarget(null);
      fetchDisasters();
    } catch {
      toast.error("Failed to delete disaster");
    }
  };

  useEffect(() => {
    if (user?.role === "admin") fetchDisasters();
  }, [user]);

  if (loading) return <SkeletonTable />;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <header className="mb-6">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Manage Disasters
        </h1>
        <p className="text-sm text-gray-500">
          Monitor, resolve or remove disaster reports
        </p>
      </header>

      {/* TABLE */}
      <div className="bg-white border rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
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
                onClick={() => setSelectedDisaster(d)}
                className="border-t hover:bg-gray-50 cursor-pointer"
              >
                <td className="p-4 font-medium">{d.type}</td>

                <td className="p-4 flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {d.location}
                </td>

                <td className="p-4">{d.severity}</td>
                <td className="p-4">{d.status}</td>

                <td
                  className="p-4 flex justify-end gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  {d.status === "Active" && (
                    <button
                      onClick={() => resolveDisaster(d._id)}
                      className="px-3 py-1 text-xs border rounded text-green-600 hover:bg-green-50"
                    >
                      <CheckCircle className="w-4 h-4 inline" /> Resolve
                    </button>
                  )}

                  <button
                    onClick={() => setDeleteTarget(d._id)}
                    className="px-3 py-1 text-xs border rounded text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 inline" /> Delete
                  </button>
                </td>
              </tr>
            ))}

            {disasters.length === 0 && (
              <tr>
                <td colSpan="5" className="p-6 text-center text-gray-500">
                  No disasters found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* DETAILS MODAL */}
      {selectedDisaster && (
        <Modal onClose={() => setSelectedDisaster(null)}>
          <h2 className="text-lg font-semibold mb-3">Disaster Details</h2>
          <p><b>Type:</b> {selectedDisaster.type}</p>
          <p><b>Location:</b> {selectedDisaster.location}</p>
          <p><b>Severity:</b> {selectedDisaster.severity}</p>
          <p><b>Status:</b> {selectedDisaster.status}</p>
          <p className="mt-2 text-sm text-gray-600">
            {selectedDisaster.description || "No description available"}
          </p>
        </Modal>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deleteTarget && (
        <Modal onClose={() => setDeleteTarget(null)}>
          <h2 className="text-lg font-semibold text-red-600 mb-4">
            Confirm Delete
          </h2>
          <p className="text-sm mb-6">
            Are you sure you want to delete this disaster?
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDeleteTarget(null)}
              className="px-4 py-2 border rounded"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 bg-red-600 text-white rounded"
            >
              Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ===============================
   ANIMATED MODAL
================================ */
function Modal({ children, onClose }) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl p-6 w-full max-w-md relative
                   transform transition-all duration-300 scale-95 opacity-0
                   animate-modal"
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          <X className="w-4 h-4" />
        </button>
        {children}
      </div>
    </div>
  );
}

/* ===============================
   SKELETON
================================ */
function SkeletonTable() {
  return (
    <div className="p-8 bg-gray-50 min-h-screen animate-pulse">
      <div className="h-6 w-48 bg-gray-200 rounded mb-6" />
      <div className="bg-white border rounded-xl p-6 space-y-4">
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
