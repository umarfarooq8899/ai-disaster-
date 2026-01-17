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
import MapView from "../../components/map/MapView";

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
      const res = await axios.get("http://localhost:5000/api/disasters/admin/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDisasters(res.data);
    } catch {
      toast.error("Failed to load disasters");
    } finally {
      setLoading(false);
    }
  };



  const verifyDisaster = async (id) => {
    try {
      await axios.patch(
        `http://localhost:5000/api/disasters/${id}/verify`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Disaster verified");
      fetchDisasters();
    } catch {
      toast.error("Failed to verify disaster");
    }
  };

  const rejectDisaster = async (id) => {
    try {
      await axios.patch(
        `http://localhost:5000/api/disasters/${id}/reject`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Disaster rejected");
      fetchDisasters();
    } catch {
      toast.error("Failed to reject disaster");
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
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Manage Disasters
          </h1>
          <p className="text-sm text-gray-500">
            Monitor, resolve or remove disaster reports
          </p>
        </div>
        <button
          onClick={async () => {
            try {
              const res = await axios.post("http://localhost:5000/api/volunteer/admin/auto-assign", {}, {
                headers: { Authorization: `Bearer ${token}` },
              });
              toast.success(res.data.message);
              fetchDisasters();
            } catch (err) {
              toast.error("Auto-assignment failed");
            }
          }}
          className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition flex items-center gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          Auto-Assign Volunteers
        </button>
      </header>

      {/* TABLE */}
      <div className="bg-white border rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 font-semibold text-gray-600 uppercase text-xs">
            <tr>
              <th className="p-4 text-left">Title</th>
              <th className="p-4 text-left">Location</th>
              <th className="p-4 text-center">Severity</th>
              <th className="p-4 text-center">Status</th>
            </tr>
          </thead>

          <tbody>
            {disasters.map((d) => (
              <tr
                key={d._id}
                onClick={() => setSelectedDisaster(d)}
                className="border-t hover:bg-gray-50 cursor-pointer"
              >
                <td className="p-4 font-medium text-left">{d.title}</td>

                <td className="p-4 flex items-center gap-1 text-left">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {d.location}
                </td>

                <td className="p-4 text-center">{d.severity}</td>
                <td className="p-4 text-center">
                  <span className={`px-2 py-1 rounded text-xs font-semibold
                    ${d.status === 'active' ? 'bg-green-100 text-green-700' :
                      d.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        d.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'}`}>
                    {d.status}
                  </span>
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
        <Modal onClose={() => setSelectedDisaster(null)} wide>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* LEFT COLUMN: MAP & LOCATION */}
            <div className="space-y-4">
              <div className="h-64 md:h-80 rounded-xl overflow-hidden border shadow-sm">
                <MapView disasters={[selectedDisaster]} showPin={true} />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Location Details
                </h3>
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Address:</strong> {selectedDisaster.location}
                </p>
                <p className="text-xs text-gray-400 font-mono">
                  Lat: {selectedDisaster.latitude}, Lng: {selectedDisaster.longitude}
                </p>
              </div>
            </div>

            {/* RIGHT COLUMN: INFO & ACTIONS */}
            <div className="flex flex-col h-full">
              <div className="flex-1 space-y-4">
                {selectedDisaster.image && (
                  <div className="rounded-lg overflow-hidden border h-48 w-full bg-gray-100">
                    <img
                      src={`http://localhost:5000/${selectedDisaster.image}`}
                      alt="Disaster"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-xl font-bold text-gray-800">{selectedDisaster.title}</h2>
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase
                          ${selectedDisaster.severity === 'high' ? 'bg-red-100 text-red-700' :
                        selectedDisaster.severity === 'medium' ? 'bg-orange-100 text-orange-700' :
                          'bg-green-100 text-green-700'}`}>
                      {selectedDisaster.severity}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded border text-gray-600 text-sm min-h-[80px]">
                    {selectedDisaster.description || "No description provided."}
                  </div>

                  <p className="text-xs text-gray-400 mt-2">
                    Reported on: {new Date(selectedDisaster.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* ACTION BAR */}
              <div className="mt-6 pt-4 border-t grid grid-cols-2 gap-3">
                {selectedDisaster.status === "pending" && (
                  <>
                    <button
                      onClick={() => verifyDisaster(selectedDisaster._id)}
                      className="flex items-center justify-center gap-2 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
                    >
                      <CheckCircle className="w-4 h-4" /> Approve
                    </button>
                    <button
                      onClick={() => rejectDisaster(selectedDisaster._id)}
                      className="flex items-center justify-center gap-2 bg-red-100 text-red-700 py-2 rounded-lg hover:bg-red-200 transition"
                    >
                      <X className="w-4 h-4" /> Reject
                    </button>
                  </>
                )}

                {selectedDisaster.status === "active" && (
                  <button
                    onClick={() => resolveDisaster(selectedDisaster._id)}
                    className="col-span-2 flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    <CheckCircle className="w-4 h-4" /> Mark as Resolved
                  </button>
                )}

                <button
                  onClick={() => setDeleteTarget(selectedDisaster._id)}
                  className={`flex items-center justify-center gap-2 border border-red-200 text-red-600 py-2 rounded-lg hover:bg-red-50 transition ${selectedDisaster.status !== 'pending' ? 'col-span-2' : 'col-span-2 mt-2'}`}
                >
                  <Trash2 className="w-4 h-4" /> Delete Report
                </button>
              </div>
            </div>
          </div>
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
function Modal({ children, onClose, ...props }) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-white rounded-xl p-6 w-full relative
                   transform transition-all duration-300 scale-95 opacity-0
                   animate-modal overflow-hidden flex flex-col max-h-[90vh]
                   ${props.wide ? 'max-w-4xl' : 'max-w-md'}`}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 z-10 bg-white rounded-full p-1"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="overflow-y-auto">
          {children}
        </div>
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
