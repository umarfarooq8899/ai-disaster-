// src/pages/admin/ManageDisasters.jsx
import React, { useEffect, useState, useContext, Component } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { AuthContext } from "../../context/AuthContext";
import {
  AlertTriangle,
  CheckCircle,
  Trash2,
  MapPin,
  Ambulance,
  Package,
  History,
  Activity,
  X
} from "lucide-react";
import MapView from "../../components/map/MapView";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught error", error, errorInfo);
    this.setState({ errorInfo });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 text-red-600 break-words">
          <h1 className="text-2xl font-bold">Something went wrong.</h1>
          <p className="font-mono mt-4 text-sm">{this.state.error?.toString()}</p>
          <pre className="mt-4 p-4 bg-gray-100 text-xs overflow-auto">{this.state.errorInfo?.componentStack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

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
  const [verifyTarget, setVerifyTarget] = useState(null); // disaster obj to verify
  const [dangerRadius, setDangerRadius] = useState(5); // default 5km
  const [assignModal, setAssignModal] = useState(null); // { type: 'rescue' | 'ngo', disasterId: string }
  const [assignmentDetails, setAssignmentDetails] = useState({ missions: [], aidAssignments: [] });
  const [auditTrail, setAuditTrail] = useState([]);
  const [impactData, setImpactData] = useState(null);
  const [activeTab, setActiveTab] = useState("info"); // 'info' | 'assignments' | 'audit'

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
      const [missionsRes, aidRes, auditRes, impactRes] = await Promise.all([
        api.get(`/admin/missions?disaster=${disasterId}`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
        api.get(`/admin/aid-assignments?disaster=${disasterId}`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
        api.get(`/admin/disasters/${disasterId}/audit-trail`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
        api.get(`/admin/disasters/${disasterId}/impact`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: null }))
      ]);
      setAssignmentDetails({
        missions: missionsRes.data || [],
        aidAssignments: aidRes.data || []
      });
      setAuditTrail(auditRes.data || []);
      setImpactData(impactRes.data || null);
    } catch (err) {
      console.error("Failed to fetch assignment details", err);
      setAssignmentDetails({ missions: [], aidAssignments: [] });
      setAuditTrail([]);
      setImpactData(null);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") {
      fetchDisasters();
      fetchOrgs();
    }
  }, [user]);

  // Actions
  const verifyDisaster = async () => {
    if (!verifyTarget) return;
    try {
      await api.patch(
        `/disasters/${verifyTarget._id}/verify`,
        { dangerRadius },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Disaster verified with Danger Zone!");
      setVerifyTarget(null);
      fetchDisasters();
      setSelectedDisaster(prev => prev ? { ...prev, status: 'active', dangerRadius } : null);
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

  const [broadcasting, setBroadcasting] = useState(false);
  const broadcastAlert = async () => {
    if (!selectedDisaster) return;
    try {
      setBroadcasting(true);
      const res = await api.post(
        `/admin/disasters/${selectedDisaster._id}/broadcast`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(res.data.message || `Alert broadcasted successfully!`);
      // Refresh audit trail to show the broadcast log
      fetchAssignmentDetails(selectedDisaster._id);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to broadcast alert");
    } finally {
      setBroadcasting(false);
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

  if (loading) return <SkeletonTable />;

  return (
    <ErrorBoundary>
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
                  <MapView
                    disasters={[selectedDisaster]}
                    showPin={true}
                    showRadius={true} // new prop to instruct MapView to draw radius
                    height="100%"
                  />
                </div>

                {/* IMPACT ANALYSIS DASHBOARD */}
                {impactData && (
                  <div className="bg-white p-4 rounded-xl border border-red-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-bl-full -z-10 opacity-50" />
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-red-500" /> Impact Analysis
                    </h3>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                        <p className="text-xs text-red-600 font-semibold mb-1 uppercase tracking-wide">Danger Zone</p>
                        <p className="text-xl font-bold text-red-700">{impactData.radiusInKm} <span className="text-sm font-medium">km</span></p>
                      </div>
                      <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                        <p className="text-xs text-orange-600 font-semibold mb-1 uppercase tracking-wide">Total Impacted</p>
                        <p className="text-xl font-bold text-orange-700">{impactData.totalImpacted}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <span className="flex-1 bg-gray-50 border px-3 py-2 rounded-lg text-sm flex items-center justify-between">
                        <span className="text-gray-500">Citizens</span>
                        <strong className="text-gray-800">{impactData.citizensInDanger}</strong>
                      </span>
                      <span className="flex-1 bg-gray-50 border px-3 py-2 rounded-lg text-sm flex items-center justify-between">
                        <span className="text-gray-500">Volunteers</span>
                        <strong className="text-gray-800">{impactData.volunteersNearby}</strong>
                      </span>
                    </div>

                    {/* Broadcast Button */}
                    <div className="mt-4 pt-4 border-t border-red-100 flex justify-end">
                      <button
                        onClick={broadcastAlert}
                        disabled={broadcasting || impactData.totalImpacted === 0}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white text-sm font-bold rounded-xl transition shadow-sm"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        {broadcasting ? "Broadcasting..." : "Broadcast Panic Alert"}
                      </button>
                    </div>
                  </div>
                )}

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
                {/* TABS */}
                <div className="flex items-center gap-1 border-b mb-4 pb-0">
                  <button
                    onClick={() => setActiveTab("info")}
                    className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${activeTab === 'info' ? 'border-brand-600 text-brand-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                  >
                    Details
                  </button>
                  <button
                    onClick={() => setActiveTab("assignments")}
                    className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${activeTab === 'assignments' ? 'border-brand-600 text-brand-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                  >
                    Assignments
                    {((selectedDisaster.rescueMissions > 0) || (selectedDisaster.ngoAssignments > 0)) && (
                      <span className="ml-1.5 bg-brand-100 text-brand-700 py-0.5 px-1.5 rounded-full text-[10px]">
                        {(selectedDisaster.rescueMissions || 0) + (selectedDisaster.ngoAssignments || 0)}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab("audit")}
                    className={`px-4 py-2 text-sm font-semibold flex items-center gap-1.5 border-b-2 transition ${activeTab === 'audit' ? 'border-purple-600 text-purple-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                  >
                    <History className="w-3.5 h-3.5" /> Timeline
                  </button>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto max-h-[50vh] pr-2">
                  {/* TAB: INFO */}
                  {activeTab === "info" && (
                    <div className="space-y-4">
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
                    </div>
                  )}

                  {/* TAB: ASSIGNMENTS */}
                  {activeTab === "assignments" && (
                    <div>
                      {(selectedDisaster.rescueMissions > 0 || selectedDisaster.ngoAssignments > 0) ? (
                        <div className="space-y-4">
                          {assignmentDetails.missions.length > 0 && (
                            <div className="mb-3">
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Rescue Missions</p>
                              <div className="space-y-3">
                                {assignmentDetails.missions.map((mission) => (
                                  <div key={mission._id} className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-sm shadow-sm transition hover:shadow-md">
                                    <div className="flex justify-between items-start mb-2">
                                      <div>
                                        <p className="font-bold text-gray-900 flex items-center gap-2">
                                          <Ambulance className="w-4 h-4 text-blue-600" />
                                          {mission.organization?.name || 'Rescue Team'}
                                        </p>
                                        <p className="text-gray-600 text-xs mt-0.5">{mission.title}</p>
                                      </div>
                                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${mission.status === 'completed' ? 'bg-green-100 text-green-700' :
                                        mission.status === "ongoing" ? "bg-brand-100 text-brand-700" :
                                          mission.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-gray-100 text-gray-700'
                                        }`}>
                                        {mission.status}
                                      </span>
                                    </div>
                                    {mission.assignedVolunteers && mission.assignedVolunteers.length > 0 && (
                                      <div className="mt-3 pt-3 border-t border-blue-100 flex items-center justify-between">
                                        <p className="text-xs font-medium text-gray-500">
                                          Active Volunteers
                                        </p>
                                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-bold">
                                          {mission.assignedVolunteers.length}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {assignmentDetails.aidAssignments.length > 0 && (
                            <div>
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">NGO Assignments</p>
                              <div className="space-y-3">
                                {assignmentDetails.aidAssignments.map((assignment) => (
                                  <div key={assignment._id} className="bg-orange-50/50 border border-orange-100 rounded-xl p-4 text-sm shadow-sm transition hover:shadow-md">
                                    <div className="flex justify-between items-start mb-2">
                                      <p className="font-bold text-gray-900 flex items-center gap-2">
                                        <Package className="w-4 h-4 text-orange-600" />
                                        {assignment.ngo?.name || 'NGO'}
                                      </p>
                                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${assignment.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                        assignment.status === "in_transit" ? "bg-brand-100 text-brand-700" :
                                          'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {assignment.status}
                                      </span>
                                    </div>
                                    {assignment.items && assignment.items.length > 0 && (
                                      <div className="mt-3 pt-3 border-t border-orange-100">
                                        <p className="text-xs font-medium text-gray-500 mb-2">Relief Items</p>
                                        <div className="flex flex-wrap gap-2">
                                          {assignment.items.map((item, idx) => (
                                            <span key={idx} className="bg-white border border-gray-200 text-gray-600 text-[10px] px-2 py-1 rounded-md flex items-center gap-1">
                                              <strong>{item.quantity}x</strong> {item.name}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-center">
                          <Package className="w-8 h-8 text-gray-300 mb-2" />
                          <p className="text-gray-500 text-sm font-medium">No active assignments yet.</p>
                          <p className="text-gray-400 text-xs mt-1">Assign a Rescue team or NGO below.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB: AUDIT TRAIL / TIMELINE */}
                  {activeTab === "audit" && (
                    <div className="pl-4 border-l-2 border-gray-100 py-2 space-y-6">
                      {auditTrail.length === 0 ? (
                        <div className="text-center p-6 text-gray-400 text-sm italic">
                          No activity recorded for this disaster yet.
                        </div>
                      ) : (
                        auditTrail.map((log) => (
                          <div key={log._id} className="relative">
                            {/* Timeline Dot */}
                            <div className={`absolute -left-[23px] w-3 h-3 rounded-full border-2 border-white ring-2 
                            ${log.organizationType === 'RescueOrganization' ? 'bg-brand-500 ring-brand-100' : log.organizationType === 'NgoOrganization' ? 'bg-orange-500 ring-orange-100' : 'bg-red-500 ring-red-100'}`}
                            />

                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md mb-2 inline-block
                                  ${log.organizationType === 'RescueOrganization' ? 'bg-brand-50 text-brand-700' : log.organizationType === 'NgoOrganization' ? 'bg-orange-50 text-orange-700' : 'bg-red-50 text-red-700'}`}>
                                    {log.updateType.replace('_', ' ')}
                                  </span>
                                  <h4 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                                    {log.organization?.name || "System Admin"}
                                  </h4>
                                </div>
                                <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap bg-gray-50 px-2 py-1 rounded-md">
                                  {new Date(log.createdAt).toLocaleString(undefined, {
                                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                  })}
                                </span>
                              </div>

                              <p className="text-sm text-gray-600 mt-2 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                                {log.description}
                              </p>

                              {/* Optional: Metrics Display if they exist */}
                              {log.metrics && Object.keys(log.metrics).length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {Object.entries(log.metrics).map(([key, value]) => (
                                    <span key={key} className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md text-[10px] font-semibold border flex items-center gap-1">
                                      <Activity className="w-3 h-3 text-gray-400" />
                                      {value} <span className="text-gray-400 font-normal">{key}</span>
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Optional: Images Display if they exist */}
                              {log.images && log.images.length > 0 && (
                                <div className="mt-3 grid grid-cols-3 gap-2">
                                  {log.images.map((img, idx) => (
                                    <div key={idx} className="aspect-video rounded bg-gray-200 overflow-hidden border">
                                      <img src={`/${img}`} alt="Update evidence" className="w-full h-full object-cover" />
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* ACTION BAR (Always visible at bottom) */}
                <div className="mt-6 pt-4 border-t space-y-3 shrink-0 bg-white">
                  {selectedDisaster.status === "pending" && (
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setVerifyTarget(selectedDisaster)}
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

        {/* VERIFY / DANGER RADIUS MODAL */}
        {verifyTarget && (
          <Modal onClose={() => setVerifyTarget(null)}>
            <h2 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Verify Disaster & Set Danger Zone
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Activating this disaster will formally log it in the system. Please define the initial <strong>Danger Zone Radius</strong> for impact analysis and safe routing.
            </p>

            <div className="mb-6 bg-red-50 p-4 rounded-xl border border-red-100">
              <label className="block text-sm font-bold text-red-800 mb-2">Danger Radius (km)</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1" max="100"
                  value={dangerRadius}
                  onChange={(e) => setDangerRadius(Number(e.target.value))}
                  className="flex-1 accent-red-600"
                />
                <span className="font-mono text-lg font-bold text-red-700 w-12 text-center bg-white px-2 py-1 rounded border border-red-200">
                  {dangerRadius}
                </span>
              </div>
              <p className="text-xs text-red-600 mt-2 italic">
                * Radius is used to calculate impacted citizens and nearby volunteers.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setVerifyTarget(null)}
                className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={verifyDisaster}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2 shadow-sm"
              >
                Activate Disaster
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
    </ErrorBoundary>
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
