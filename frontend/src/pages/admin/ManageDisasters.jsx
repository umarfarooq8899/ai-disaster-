// src/pages/admin/ManageDisasters.jsx
import React, { useEffect, useState, useContext } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { AuthContext } from "../../context/AuthContext";
import {
  AlertTriangle,
  CheckCircle,
  Trash2,
  MapPin,
  X,
  Ambulance,
  Package,
} from "lucide-react"; // Added Ambulance (Rescue) and Package (NGO) icons
import MapView from "../../components/map/MapView";

export default function ManageDisasters() {
  const { user, token } = useContext(AuthContext);

  const [disasters, setDisasters] = useState([]);
  const [loading, setLoading] = useState(true);

  // Data for assignments
  const [rescueOrgs, setRescueOrgs] = useState([]);
  const [ngoOrgs, setNgoOrgs] = useState([]);

  // Modal States
  const [selectedDisaster, setSelectedDisaster] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [assignModal, setAssignModal] = useState(null); // { type: 'rescue' | 'ngo', disasterId: string }
  const [assignmentDetails, setAssignmentDetails] = useState({ missions: [], aidAssignments: [] });

  // Form States
  const [assignForm, setAssignForm] = useState({
    organizationId: "",
    title: "", // For Rescue Mission
    description: "", // For Rescue Mission
    skills: [], // For Rescue Mission
    items: [], // For NGO: [{ name, quantity }]
    notes: "", // For NGO
  });

  // Dynamic Item State for NGO
  const [newItem, setNewItem] = useState({ name: "", quantity: 1 });

  const fetchDisasters = async () => {
    try {
      setLoading(true);
      const res = await api.get("/disasters/admin/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDisasters(res.data);
    } catch {
      toast.error("Failed to load disasters");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrgs = async () => {
    try {
      const [rescueRes, ngoRes] = await Promise.all([
        api.get("/disasters/orgs/rescue", { headers: { Authorization: `Bearer ${token}` } }),
        api.get("/disasters/orgs/ngo", { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setRescueOrgs(rescueRes.data);
      setNgoOrgs(ngoRes.data);
    } catch (err) {
      console.error("Failed to fetch orgs", err);
    }
  };

  const fetchAssignmentDetails = async (disasterId) => {
    try {
      const [missionsRes, aidRes] = await Promise.all([
        api.get(`/admin/missions?disaster=${disasterId}`, { headers: { Authorization: `Bearer ${token}` } }),
        api.get(`/admin/aid-assignments?disaster=${disasterId}`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setAssignmentDetails({
        missions: missionsRes.data || [],
        aidAssignments: aidRes.data || []
      });
    } catch (err) {
      console.error("Failed to fetch assignment details", err);
      setAssignmentDetails({ missions: [], aidAssignments: [] });
    }
  };

  useEffect(() => {
    if (user?.role === "admin") {
      fetchDisasters();
      fetchOrgs();
    }
  }, [user]);

  // Actions
  const verifyDisaster = async (id) => {
    try {
      await api.patch(
        `/disasters/${id}/verify`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Disaster verified");
      fetchDisasters();
      setSelectedDisaster(prev => prev ? { ...prev, status: 'active' } : null);
    } catch {
      toast.error("Failed to verify disaster");
    }
  };

  const rejectDisaster = async (id) => {
    try {
      await api.patch(
        `/disasters/${id}/reject`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Disaster rejected");
      fetchDisasters();
      setSelectedDisaster(null);
    } catch {
      toast.error("Failed to reject disaster");
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAssignSubmit = async () => {
    try {
      setIsSubmitting(true);
      const endpoint = assignModal.type === 'rescue'
        ? "/disasters/assign/rescue"
        : "/disasters/assign/aid";

      const payload = {
        disasterId: assignModal.disasterId,
        organizationId: assignForm.organizationId,
        ...assignForm
      };

      // Clean up payload based on type
      if (assignModal.type === 'rescue') {
        delete payload.items;
        delete payload.notes;
        payload.skillsRequired = assignForm.skills;
      } else {
        delete payload.title;
        delete payload.description;
        delete payload.skills;
        payload.items = assignForm.items;
      }

      await api.post(endpoint, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(`Assigned to ${assignModal.type === 'rescue' ? 'Rescue Team' : 'NGO'} successfully`);

      // Refresh data
      fetchDisasters();
      fetchAssignmentDetails(assignModal.disasterId);

      // Update current modal view if open
      if (selectedDisaster && selectedDisaster._id === assignModal.disasterId) {
        setSelectedDisaster(prev => ({
          ...prev,
          rescueMissions: assignModal.type === 'rescue' ? (prev.rescueMissions || 0) + 1 : prev.rescueMissions,
          ngoAssignments: assignModal.type === 'ngo' ? (prev.ngoAssignments || 0) + 1 : prev.ngoAssignments
        }));
      }

      setAssignModal(null);
      // Reset form
      setAssignForm({ organizationId: "", title: "", description: "", skills: [], items: [], notes: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Assignment failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to add item to NGO list
  const addNgoItem = () => {
    if (!newItem.name) return;
    setAssignForm(prev => ({
      ...prev,
      items: [...prev.items, { ...newItem }]
    }));
    setNewItem({ name: "", quantity: 1 });
  };

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
            Monitor, verify, and assign relief teams
          </p>
        </div>
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
              <th className="p-4 text-center">Assignments</th>
            </tr>
          </thead>

          <tbody>
            {disasters.map((d) => (
              <tr
                key={d._id}
                onClick={() => {
                  setSelectedDisaster(d);
                  if (d.rescueMissions > 0 || d.ngoAssignments > 0) {
                    fetchAssignmentDetails(d._id);
                  }
                }}
                className="border-t hover:bg-gray-50 cursor-pointer"
              >
                <td className="p-4 align-middle font-medium">{d.title}</td>

                <td className="p-4 align-middle">
                  <div className="flex items-start gap-2 max-w-md">
                    <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                    <span className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                      {d.location}
                    </span>
                  </div>
                </td>

                <td className="p-4 align-middle text-center">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
                    ${d.severity === 'high' ? 'bg-red-100 text-red-700' :
                      d.severity === 'medium' ? 'bg-orange-100 text-orange-700' :
                        'bg-green-100 text-green-700'}`}>
                    {d.severity}
                  </span>
                </td>

                <td className="p-4 align-middle text-center">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
                    ${d.status === 'active' ? 'bg-green-100 text-green-700' :
                      d.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        d.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          d.status === 'resolved' ? 'bg-purple-100 text-purple-700' :
                            'bg-brand-100 text-brand-700'}`}>
                    {d.status}
                  </span>
                </td>

                <td className="p-4 align-middle">
                  <div className="flex flex-col gap-1.5 items-center justify-center min-w-[120px]">
                    {d.assignedRescueOrgs?.length > 0 && d.assignedRescueOrgs.map((org, i) => (
                      <span key={i} className="px-2 py-1 rounded-md text-[10px] font-semibold bg-brand-50 text-brand-700 border border-brand-100 flex items-center gap-1.5 w-full justify-center">
                        <Ambulance className="w-3 h-3 shrink-0" />
                        <span className="truncate">{org}</span>
                      </span>
                    ))}
                    {d.assignedNgoOrgs?.length > 0 && d.assignedNgoOrgs.map((org, i) => (
                      <span key={i} className="px-2 py-1 rounded-md text-[10px] font-semibold bg-orange-50 text-orange-700 border border-orange-100 flex items-center gap-1.5 w-full justify-center">
                        <Package className="w-3 h-3 shrink-0" />
                        <span className="truncate">{org}</span>
                      </span>
                    ))}
                    {!d.rescueMissions && !d.ngoAssignments && (
                      <span className="text-xs text-gray-400 italic">Unassigned</span>
                    )}
                  </div>
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
                  <div className="rounded-lg overflow-hidden border h-48 w-full bg-gray-100 mb-4">
                    <img
                      src={`/${selectedDisaster.image}`}
                      alt="Disaster"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {selectedDisaster.video && (
                  <div className="rounded-lg overflow-hidden border w-full bg-black mb-4">
                    <video
                      controls
                      src={`/${selectedDisaster.video}`}
                      className="w-full h-auto max-h-60"
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
                    Reported by: {selectedDisaster.reportedBy?.name} ({selectedDisaster.reportedBy?.email})
                  </p>
                </div>

                {/* ASSIGNMENTS SECTION */}
                {(selectedDisaster.rescueMissions > 0 || selectedDisaster.ngoAssignments > 0) && (
                  <div className="mt-4">
                    <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" /> Assignments
                    </h3>

                    {assignmentDetails.missions.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-gray-600 mb-2">Rescue Missions ({assignmentDetails.missions.length})</p>
                        <div className="space-y-2">
                          {assignmentDetails.missions.map((mission) => (
                            <div key={mission._id} className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                              <div className="flex justify-between items-start mb-1">
                                <div>
                                  <p className="font-semibold text-brand-800">{mission.organization?.name || 'Rescue'}</p>
                                  <p className="text-gray-600 text-xs">{mission.title}</p>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${mission.status === 'completed' ? 'bg-green-100 text-green-700' :
                                  mission.status === "ongoing" ? "bg-brand-100 text-brand-700" :
                                    mission.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-gray-100 text-gray-700'
                                  }`}>
                                  {mission.status}
                                </span>
                              </div>
                              {mission.assignedVolunteers && mission.assignedVolunteers.length > 0 && (
                                <p className="text-xs text-gray-600">
                                  {mission.assignedVolunteers.length} volunteer(s) assigned
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {assignmentDetails.aidAssignments.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-2">NGO Assignments ({assignmentDetails.aidAssignments.length})</p>
                        <div className="space-y-2">
                          {assignmentDetails.aidAssignments.map((assignment) => (
                            <div key={assignment._id} className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm">
                              <div className="flex justify-between items-start mb-1">
                                <p className="font-medium text-gray-800">{assignment.ngo?.name || 'NGO'}</p>
                                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${assignment.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                  assignment.status === "in_transit" ? "bg-brand-100 text-brand-700" :
                                    'bg-yellow-100 text-yellow-700'
                                  }`}>
                                  {assignment.status}
                                </span>
                              </div>
                              {assignment.items && assignment.items.length > 0 && (
                                <p className="text-xs text-gray-600">
                                  {assignment.items.length} item(s)
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ACTION BAR */}
              <div className="mt-6 pt-4 border-t space-y-3">
                {selectedDisaster.status === "pending" && (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => verifyDisaster(selectedDisaster._id)}
                      className="flex items-center justify-center gap-2 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
                    >
                      <CheckCircle className="w-4 h-4" /> Verify & Activate
                    </button>
                    <button
                      onClick={() => rejectDisaster(selectedDisaster._id)}
                      className="flex items-center justify-center gap-2 bg-red-100 text-red-700 py-2 rounded-lg hover:bg-red-200 transition"
                    >
                      <X className="w-4 h-4" /> Reject
                    </button>
                  </div>
                )}

                {selectedDisaster.status === "active" && (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setAssignModal({ type: 'rescue', disasterId: selectedDisaster._id })}
                      disabled={selectedDisaster.rescueMissions > 0}
                      className={`flex items-center justify-center gap-2 py-2 rounded-lg transition
                        ${selectedDisaster.rescueMissions > 0
                          ? "bg-brand-100 text-brand-600 cursor-not-allowed"
                          : "bg-brand-600 text-white hover:bg-brand-700"}`}
                    >
                      <Ambulance className="w-4 h-4" />
                      {selectedDisaster.rescueMissions > 0 ? "Rescue Assigned" : "Assign Rescue"}
                    </button>

                    <button
                      onClick={() => setAssignModal({ type: 'ngo', disasterId: selectedDisaster._id })}
                      disabled={selectedDisaster.ngoAssignments > 0}
                      className={`flex items-center justify-center gap-2 py-2 rounded-lg transition
                        ${selectedDisaster.ngoAssignments > 0
                          ? 'bg-orange-100 text-orange-600 cursor-not-allowed'
                          : 'bg-orange-500 text-white hover:bg-orange-600'}`}
                    >
                      <Package className="w-4 h-4" />
                      {selectedDisaster.ngoAssignments > 0 ? "NGO Assigned" : "Assign NGO"}
                    </button>

                    <button
                      onClick={async () => {
                        try {
                          await api.patch(`/disasters/${selectedDisaster._id}/resolve`, {}, {
                            headers: { Authorization: `Bearer ${token}` }
                          });
                          toast.success("Disaster resolved");
                          fetchDisasters();
                          setSelectedDisaster(prev => ({ ...prev, status: 'resolved' }));
                        } catch {
                          toast.error("Failed to resolve");
                        }
                      }}
                      className="col-span-2 flex items-center justify-center gap-2 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition"
                    >
                      <CheckCircle className="w-4 h-4" /> Mark as Resolved
                    </button>
                  </div>
                )}

                {/* Delete Button - Always visible */}
                <button
                  onClick={() => setDeleteTarget(selectedDisaster._id)}
                  className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 hover:text-red-700 transition"
                >
                  <Trash2 className="w-4 h-4" /> Delete Disaster
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ASSIGNMENT MODAL */}
      {assignModal && (
        <Modal onClose={() => setAssignModal(null)}>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            {assignModal.type === 'rescue' ? <Ambulance className="w-5 h-5 text-brand-600" /> : <Package className="w-5 h-5 text-orange-600" />}
            Assign {assignModal.type === 'rescue' ? 'Rescue Mission' : 'Relief Operation'}
          </h2>

          <div className="space-y-4">
            {/* Common: Select Organization */}
            <div>
              <label className="block text-sm font-medium mb-1">Organization</label>
              <select
                className="w-full border rounded p-2"
                value={assignForm.organizationId}
                onChange={(e) => setAssignForm({ ...assignForm, organizationId: e.target.value })}
              >
                <option value="">Select Organization</option>
                {(assignModal.type === 'rescue' ? rescueOrgs : ngoOrgs).map(org => (
                  <option key={org._id} value={org._id}>{org.name} ({org.location})</option>
                ))}
              </select>
            </div>

            {assignModal.type === 'rescue' ? (
              // RESCUE FORM
              <>
                <input
                  placeholder="Mission Title"
                  className="w-full border rounded p-2"
                  value={assignForm.title}
                  onChange={(e) => setAssignForm({ ...assignForm, title: e.target.value })}
                />
                <textarea
                  placeholder="Mission Description"
                  className="w-full border rounded p-2"
                  value={assignForm.description}
                  onChange={(e) => setAssignForm({ ...assignForm, description: e.target.value })}
                />
                <div>
                  <label className="block text-sm font-medium mb-1">Skills Required</label>
                  <div className="flex flex-wrap gap-2">
                    {['medical', 'technical', 'rescue', 'logistics'].map(skill => (
                      <label key={skill} className="flex items-center gap-1 text-sm bg-gray-100 px-2 py-1 rounded">
                        <input
                          type="checkbox"
                          checked={assignForm.skills.includes(skill)}
                          onChange={(e) => {
                            const newSkills = e.target.checked
                              ? [...assignForm.skills, skill]
                              : assignForm.skills.filter(s => s !== skill);
                            setAssignForm({ ...assignForm, skills: newSkills });
                          }}
                        />
                        {skill}
                      </label>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              // NGO FORM
              <>
                <div className="bg-gray-50 p-3 rounded border">
                  <label className="block text-sm font-medium mb-2">Relief Items</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      placeholder="Item Name"
                      className="flex-1 border rounded p-1 text-sm"
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      className="w-20 border rounded p-1 text-sm"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) })}
                    />
                    <button onClick={addNgoItem} className="bg-gray-200 px-3 rounded text-sm">+</button>
                  </div>
                  <div className="space-y-1">
                    {assignForm.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm bg-white p-1 px-2 rounded border">
                        <span>{item.name}</span>
                        <span className="font-mono">x{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <textarea
                  placeholder="Notes for NGO..."
                  className="w-full border rounded p-2"
                  value={assignForm.notes}
                  onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
                />
              </>
            )}

            <button
              onClick={handleAssignSubmit}
              disabled={
                !assignForm.organizationId ||
                (assignModal.type === 'rescue' && !assignForm.title) ||
                isSubmitting
              }
              className="w-full bg-brand-600 text-white py-2 rounded hover:bg-brand-700 disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm Assignment"
              )}
            </button>
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
              onClick={async () => {
                /* deletion logic similar to original */
                try {
                  await api.delete(
                    `/disasters/${deleteTarget}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                  );
                  toast.success("Deleted");
                  setDeleteTarget(null);
                  setSelectedDisaster(null); // Close the detail modal too
                  fetchDisasters();
                } catch { toast.error("Failed to delete"); }
              }}
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
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-white rounded-xl p-6 w-full relative
                   transform transition-all duration-300 scale-100 opacity-100 shadow-2xl
                   overflow-hidden flex flex-col max-h-[90vh]
                   ${props.wide ? 'max-w-4xl' : 'max-w-md'}`}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 z-10 bg-gray-100 rounded-full p-1"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="overflow-y-auto pr-1">
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
