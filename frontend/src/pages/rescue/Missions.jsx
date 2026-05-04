import React, { useContext, useEffect, useState, useMemo } from "react";
import { AuthContext } from "../../context/AuthContext";
import axios from "../../api/axios";
import {
  MapPin, CheckCircle, AlertCircle, Calculator, X, Users,
  Activity, FileImage, Search, Loader2, Shield, Eye, ClipboardList, Ambulance, Flame, ZoomIn
} from "lucide-react";
import toast from "react-hot-toast";
import { getFileUrl } from "../../utils/fileUtils";

const STATUS_TABS = ["pending", "ongoing", "pending_verification"];

const statusStyle = {
  completed: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  pending: "bg-amber-50 text-amber-700 border border-amber-100",
  ongoing: "bg-blue-50 text-blue-700 border border-blue-100",
  pending_verification: "bg-brand-50 text-brand-700 border border-brand-100",
};

const statusLabel = {
  pending: "Pending",
  ongoing: "Ongoing",
  pending_verification: "Verify Proof",
  completed: "Completed",
};

export default function Missions() {
  const { token } = useContext(AuthContext);

  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [search, setSearch] = useState("");

  // Volunteer assignment modal
  const [assignModal, setAssignModal] = useState(null); // mission object
  const [taskDescription, setTaskDescription] = useState("");
  const [volunteers, setVolunteers] = useState([]);
  const [selectedVolunteers, setSelectedVolunteers] = useState([]);
  const [recommendedVolunteers, setRecommendedVolunteers] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [assigning, setAssigning] = useState(false);

  // Verify proof modal
  const [verifyModal, setVerifyModal] = useState(null); // mission object
  const [verifyingId, setVerifyingId] = useState(null); // volunteerId currently being verified
  const [lightbox, setLightbox] = useState(null); // { url, isVideo }

  // ─── Fetch ────────────────────────────────────────────────────────────────
  const fetchMissions = async () => {
    try {
      const res = await axios.get("/rescue/missions");
      // Only active missions here — completed ones live on the History page
      setMissions(res.data.filter((m) => m.status !== "completed"));
    } catch {
      toast.error("Failed to load missions.");
    } finally {
      setLoading(false);
    }
  };

  const fetchVolunteers = async () => {
    try {
      const res = await axios.get("/rescue/volunteer-management");
      setVolunteers(res.data);
    } catch {
      console.error("Could not load volunteers.");
    }
  };

  useEffect(() => {
    if (token) {
      fetchMissions();
      fetchVolunteers();
    }
  }, [token]);

  // ─── Recommendations ──────────────────────────────────────────────────────
  const fetchRecommendations = async (missionId) => {
    setLoadingRecs(true);
    setRecommendedVolunteers([]);
    try {
      const res = await axios.get(
        `/volunteer/recommendations?taskId=${missionId}&type=Mission`
      );
      setRecommendedVolunteers(res.data);
    } catch {
      // fall back to plain volunteers list silently
    } finally {
      setLoadingRecs(false);
    }
  };

  const openAssignModal = (mission) => {
    const preSelected = (mission.assignedVolunteers || []).map(
      (v) => v._id || v
    );
    setSelectedVolunteers(preSelected);
    setTaskDescription(mission.taskDescription || "");
    setAssignModal(mission);
    fetchRecommendations(mission._id);
  };

  // ─── Assign Volunteers ────────────────────────────────────────────────────
  const handleAssignVolunteers = async () => {
    if (selectedVolunteers.length === 0) {
      toast.error("Please select at least one volunteer.");
      return;
    }
    setAssigning(true);
    try {
      await axios.post(
        `/rescue/missions/${assignModal._id}/assign-volunteers`,
        { volunteerIds: selectedVolunteers, taskDescription }
      );
      toast.success("Volunteers assigned successfully!");
      closeAssignModal();
      fetchMissions();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to assign volunteers.");
    } finally {
      setAssigning(false);
    }
  };

  const closeAssignModal = () => {
    setAssignModal(null);
    setSelectedVolunteers([]);
    setRecommendedVolunteers([]);
    setTaskDescription("");
  };

  // ─── Verify Proof (Coordinator) ───────────────────────────────────────────
  const handleVerifyMission = async (volunteerId) => {
    if (!verifyModal) return;
    if (verifyingId) return; // already processing, block duplicate calls
    const vidStr = volunteerId?.toString();
    setVerifyingId(vidStr);
    try {
      await axios.post(`/rescue/missions/${verifyModal._id}/verify`, { volunteerId: vidStr });
      toast.success("Volunteer proof verified!");
      setVerifyModal(null);
      fetchMissions();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to verify volunteer.");
    } finally {
      setVerifyingId(null);
    }
  };

  // ─── Auto Assign ──────────────────────────────────────────────────────────
  const handleAutoAssign = async () => {
    const id = toast.loading("Running auto-assignment...");
    try {
      const res = await axios.post("/volunteer/admin/auto-assign");
      toast.success(res.data.message, { id });
      fetchMissions();
    } catch (err) {
      toast.error(err.response?.data?.message || "Auto-assignment failed.", { id });
    }
  };

  // ─── Filtering ────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = missions.filter((m) => m.status === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          m.title?.toLowerCase().includes(q) ||
          m.location?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [missions, activeTab, search]);

  const counts = useMemo(
    () => ({
      pending: missions.filter((m) => m.status === "pending").length,
      ongoing: missions.filter((m) => m.status === "ongoing").length,
      pending_verification: missions.filter((m) => m.status === "pending_verification").length,
    }),
    [missions]
  );

  // ─── Toggle volunteer selection ───────────────────────────────────────────
  const toggleVolunteer = (id) =>
    setSelectedVolunteers((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );

  // ─── Render ───────────────────────────────────────────────────────────────
  if (loading)
    return (
      <div className="p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse h-48" />
        ))}
      </div>
    );

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manage Missions</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Coordinate rescue teams and track disaster response missions.
          </p>
        </div>
        <button
          onClick={handleAutoAssign}
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition shadow-md font-medium"
        >
          <Calculator className="w-5 h-5" />
          Auto Assign
        </button>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm flex-wrap">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all flex items-center gap-1.5 ${activeTab === tab
                ? "bg-brand-600 text-white shadow"
                : "text-gray-500 hover:text-gray-700"
                }`}
            >
              {tab === "pending_verification" ? (
                <><Eye className="w-3.5 h-3.5" /> Verify Proof</>
              ) : (
                tab
              )}
              <span
                className={`ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === tab
                  ? "bg-white/20 text-white"
                  : tab === "pending_verification" && counts.pending_verification > 0
                    ? "bg-brand-100 text-brand-700"
                    : "bg-gray-100 text-gray-500"
                  }`}
              >
                {counts[tab]}
              </span>
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-gray-400">
          <Shield className="w-12 h-12 mb-4 opacity-20" />
          <p className="font-medium">No missions found.</p>
          <p className="text-xs mt-1">
            {activeTab === "pending_verification"
              ? "No missions are awaiting proof verification."
              : `There are no ${activeTab} missions.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((mission) => (
            <div
              key={mission._id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group max-h-[400px]"
            >
              {/* Card Header */}
              <div className="p-6 border-b border-gray-50 flex justify-between items-start relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:rotate-12 transition-transform duration-500">
                  <Activity className="w-24 h-24" />
                </div>
                <div className="relative z-10 min-w-0">
                  <h3 className="font-bold text-lg text-gray-800 truncate group-hover:text-brand-600 transition-colors uppercase tracking-tight">
                    {mission.title}
                  </h3>
                  <p className="text-xs text-gray-400 font-medium flex items-center gap-1 mt-1 uppercase">
                    <MapPin className="w-3 h-3 text-emerald-500" />
                    {mission.location || "Location N/A"}
                  </p>
                </div>
                <span className={`relative z-10 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusStyle[mission.status] || "bg-gray-100 text-gray-600"}`}>
                  {statusLabel[mission.status] || mission.status}
                </span>
              </div>

              {/* Card Body */}
              <div className="p-6 space-y-4 flex-grow overflow-y-auto">
                <p className="text-sm text-gray-600 line-clamp-2">{mission.description}</p>

                {/* Resource Requirements */}
                {(mission.volunteersRequired > 0 || mission.ambulancesRequired > 0 || mission.firefightersRequired > 0) && (
                  <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2">Required Resources</p>
                    <div className="flex flex-wrap gap-2">
                      {mission.volunteersRequired > 0 && (
                        <span className="flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-lg">
                          <Users className="w-3 h-3" /> {mission.volunteersRequired} Volunteers
                        </span>
                      )}
                      {mission.ambulancesRequired > 0 && (
                        <span className="flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-100 px-2.5 py-1 rounded-lg">
                          <Ambulance className="w-3 h-3" /> {mission.ambulancesRequired} Ambulances
                        </span>
                      )}
                      {mission.firefightersRequired > 0 && (
                        <span className="flex items-center gap-1 text-xs font-semibold text-orange-700 bg-orange-100 px-2.5 py-1 rounded-lg">
                          <Flame className="w-3 h-3" /> {mission.firefightersRequired} Firefighters
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Task Description (if set by coordinator) */}
                {mission.taskDescription && (
                  <div className="bg-gray-50 rounded-xl p-3 border">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <ClipboardList className="w-3 h-3" /> Task Description
                    </p>
                    <p className="text-xs text-gray-700 line-clamp-2">{mission.taskDescription}</p>
                  </div>
                )}

                {/* Team */}
                <div className="pt-3 border-t border-dashed border-gray-100">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                    <Users className="w-3 h-3 text-brand-500" />
                    Rescue Team ({(mission.assignedVolunteers || []).length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(mission.assignedVolunteers || []).length > 0 ? (
                      mission.assignedVolunteers.map((v, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-bold bg-brand-50 text-brand-600 px-2.5 py-1 rounded-lg border border-brand-100"
                        >
                          {v.name || "Unknown"}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] italic text-gray-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-amber-400" />
                        No volunteers assigned yet
                      </span>
                    )}
                  </div>
                </div>

                {/* Evidence (pending_verification) */}
                {mission.status === "pending_verification" && mission.volunteerCompletions?.filter(c => c.status === "pending_verification").length > 0 && (
                  <div className="pt-3 border-t border-dashed border-gray-100">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-brand-500 uppercase tracking-widest mb-2">
                      <FileImage className="w-3 h-3" />
                      {mission.volunteerCompletions.filter(c => c.status === "pending_verification").length} volunteer proof{mission.volunteerCompletions.filter(c => c.status === "pending_verification").length > 1 ? "s" : ""} awaiting review
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {mission.volunteerCompletions
                        .filter(c => c.status === "pending_verification")
                        .slice(0, 3)
                        .flatMap(c => (c.evidenceUrls || []).slice(0, 1))
                        .map((url, i) => {
                          const isVideo = url.match(/\.(mp4|mov|avi|webm)$/i);
                          return isVideo ? (
                            <div key={i} className="aspect-square rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center">
                              <span className="text-[10px] text-brand-600 font-bold text-center p-1">🎥 Video</span>
                            </div>
                          ) : (
                            <div key={i} className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                              <img src={getFileUrl(url)} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover" />
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer */}
              {mission.status === "pending_verification" ? (
                <div className="p-4 border-t bg-brand-50 flex flex-col gap-2">
                  <p className="text-xs text-brand-600 font-semibold text-center mb-1">
                    🔍 Volunteer submitted proof — review and verify
                  </p>
                  <button
                    onClick={() => setVerifyModal(mission)}
                    className="w-full bg-brand-600 text-white py-2 rounded-lg hover:bg-brand-700 transition flex items-center justify-center gap-2 text-sm font-semibold shadow-sm"
                  >
                    <Eye className="w-4 h-4" />
                    Verify & Mark Complete
                  </button>
                  <button
                    onClick={() => openAssignModal(mission)}
                    className="w-full bg-gray-100 text-brand-700 py-2 rounded-lg hover:bg-gray-200 transition flex items-center justify-center gap-2 text-sm font-semibold"
                  >
                    <Users className="w-4 h-4" /> Manage Volunteers
                  </button>
                </div>
              ) : mission.status !== "completed" ? (
                <div className="p-4 border-t bg-gray-50 flex flex-col gap-2">
                  <button
                    onClick={() => openAssignModal(mission)}
                    className="w-full bg-brand-600 text-white py-2 rounded-lg hover:bg-brand-700 transition flex items-center justify-center gap-2 text-sm font-semibold shadow-sm"
                  >
                    <Users className="w-4 h-4" />
                    {mission.assignedVolunteers?.length > 0 ? "Manage Volunteers" : "Assign Volunteers"}
                  </button>
                </div>
              ) : (
                <div className="p-4 border-t bg-emerald-50 flex items-center justify-center gap-2 text-emerald-700 text-sm font-semibold">
                  <CheckCircle className="w-4 h-4" /> Mission Completed
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── ASSIGN VOLUNTEERS MODAL ─────────────────────────────────────────── */}
      {assignModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeAssignModal}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold mb-1">Assign Volunteers</h2>
            <p className="text-sm text-gray-500 mb-4">
              Mission: <span className="font-semibold text-gray-700">{assignModal.title}</span>
            </p>

            {/* Task Description */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <ClipboardList className="w-4 h-4 text-brand-500" /> Task Description (for volunteers)
              </label>
              <textarea
                placeholder="Describe what volunteers should do, where to go, and what to bring..."
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                rows={3}
                className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
            </div>

            {/* Volunteer list */}
            <div className="border rounded-lg max-h-64 overflow-y-auto">
              {loadingRecs ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin mb-2" />
                  <span className="text-xs">Finding best matches…</span>
                </div>
              ) : recommendedVolunteers.length > 0 ? (
                <div className="p-2 space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 pt-1 mb-2">
                    AI Recommended (sorted by proximity & skill)
                  </p>
                  {recommendedVolunteers.map((rec, idx) => {
                    const vid = rec.user?._id || rec.user;
                    const checked = selectedVolunteers.includes(vid);
                    return (
                      <label
                        key={rec._id}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${checked
                          ? "bg-brand-50 border-brand-200"
                          : "hover:bg-gray-50 border-gray-100"
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleVolunteer(vid)}
                          className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4 mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold text-gray-800 truncate">
                              {rec.name || "Unknown"}
                            </span>
                            {idx < 3 && (
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full shrink-0 ml-2">
                                Top Match
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                            {rec.distance !== null && rec.distance !== Infinity && (
                              <span className="flex items-center gap-0.5">
                                <MapPin className="w-3 h-3" />
                                {rec.distance} km
                              </span>
                            )}
                            {rec.matchScore > 0 && (
                              <span className="flex items-center gap-0.5">
                                <CheckCircle className="w-3 h-3 text-emerald-500" />
                                {rec.matchScore}% skill match
                              </span>
                            )}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              ) : volunteers.filter((v) => !v.isProfileIncomplete).length > 0 ? (
                <div className="p-2 space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 pt-1 mb-2">
                    All Available Volunteers
                  </p>
                  {volunteers
                    .filter((v) => !v.isProfileIncomplete)
                    .map((vol) => {
                      const vid = vol.user?._id || vol._id;
                      const checked = selectedVolunteers.includes(vid);
                      return (
                        <label
                          key={vol._id}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${checked
                            ? "bg-brand-50 border-brand-200"
                            : "hover:bg-gray-50 border-gray-100"
                            }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleVolunteer(vid)}
                            className="rounded text-brand-600 w-4 h-4"
                          />
                          <span className="text-sm font-medium text-gray-700">
                            {vol.user?.name || vol.name || "Unknown"}
                          </span>
                        </label>
                      );
                    })}
                </div>
              ) : (
                <div className="py-10 flex flex-col items-center text-gray-400">
                  <Users className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-sm">No available volunteers found.</p>
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                {selectedVolunteers.length} volunteer(s) selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={closeAssignModal}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignVolunteers}
                  disabled={assigning || selectedVolunteers.length === 0}
                  className="px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-lg hover:bg-brand-700 disabled:opacity-50 transition flex items-center gap-2"
                >
                  {assigning && <Loader2 className="w-4 h-4 animate-spin" />}
                  Assign ({selectedVolunteers.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── VERIFY PROOF MODAL ────────────────────────────────────────────────── */}
      {verifyModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setVerifyModal(null)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center">
                <Eye className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">Verify Volunteer Proof</h2>
                <p className="text-xs text-gray-500">{verifyModal.title}</p>
              </div>
            </div>

            <div className="space-y-6">
              {verifyModal.volunteerCompletions?.filter(c => c.status === "pending_verification").length > 0 ? (
                verifyModal.volunteerCompletions
                  .filter(c => c.status === "pending_verification")
                  .map((completion, idx) => {
                    // Find volunteer details
                    const volunteerInfo = verifyModal.assignedVolunteers?.find(
                      (v) => (v._id || v).toString() === completion.volunteerId.toString()
                    );
                    const volunteerName = volunteerInfo?.name || "Unknown Volunteer";

                    return (
                      <div key={idx} className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="font-semibold text-gray-800 text-sm">
                            {volunteerName}
                          </h3>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-brand-100 text-brand-700 rounded-full">
                            Awaiting Review
                          </span>
                        </div>

                        {completion.evidenceUrls?.length > 0 ? (
                          <div className="mb-4">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                              Submitted Files ({completion.evidenceUrls.length})
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              {completion.evidenceUrls.map((url, i) => {
                                const isVideo = url.match(/\.(mp4|mov|avi|webm)$/i);
                                return isVideo ? (
                                  <div key={i} className="rounded-lg overflow-hidden border border-gray-200 bg-black relative aspect-video" onClick={(e) => { e.stopPropagation(); setLightbox({ url: getFileUrl(url), isVideo: true }); }}>
                                    <video src={getFileUrl(url)} className="w-full h-full object-cover cursor-pointer" />
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                      <span className="bg-black/60 text-white px-2 py-1 rounded-md text-[10px] font-medium backdrop-blur-sm">Play</span>
                                    </div>
                                  </div>
                                ) : (
                                  <button key={i} onClick={() => setLightbox({ url: getFileUrl(url), isVideo: false })}
                                    className="block rounded-lg overflow-hidden border border-gray-200 hover:opacity-90 transition relative group/thumb w-full h-full text-left aspect-video">
                                    <img src={getFileUrl(url)} alt={`Evidence ${i + 1}`} className="w-full object-cover h-full" />
                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/thumb:opacity-100 transition flex items-center justify-center">
                                      <ZoomIn className="w-5 h-5 text-white drop-shadow-md" />
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="mb-4 bg-amber-50 rounded-lg p-3 border border-amber-100 text-center">
                            <p className="text-xs text-amber-700 font-medium">Completed without uploading proof.</p>
                          </div>
                        )}

                        <button
                          onClick={() => handleVerifyMission(completion.volunteerId)}
                          disabled={!!verifyingId}
                          className="w-full py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 rounded-lg transition flex items-center justify-center gap-2"
                        >
                          {verifyingId === completion.volunteerId?.toString() && <Loader2 className="w-4 h-4 animate-spin" />}
                          ✓ Verify {volunteerName}'s Proof
                        </button>
                      </div>
                    );
                  })
              ) : (
                <div className="py-8 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <p className="text-sm font-medium">No proofs awaiting verification.</p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t flex gap-3">
              <button
                onClick={() => setVerifyModal(null)}
                className="w-full py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── LIGHTBOX ────────────────────────────────────────────── */}
      {lightbox && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition cursor-pointer" onClick={() => setLightbox(null)}>
            <X className="w-6 h-6" />
          </button>
          {lightbox.isVideo ? (
            <video src={lightbox.url} controls autoPlay className="max-w-full max-h-[85vh] rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()} />
          ) : (
            <img src={lightbox.url} alt="Evidence" className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl" onClick={(e) => e.stopPropagation()} />
          )}
          <p className="absolute bottom-4 text-white/50 text-xs text-center w-full">Click anywhere outside to close</p>
        </div>
      )}
    </div>
  );
}
