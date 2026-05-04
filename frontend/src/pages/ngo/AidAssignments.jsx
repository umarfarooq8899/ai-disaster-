import React, { useContext, useEffect, useState, useMemo } from "react";
import { AuthContext } from "../../context/AuthContext";
import axios from "../../api/axios";
import {
    Package, MapPin, Users, Loader2, X, CheckCircle,
    Eye, ClipboardList, Search, Activity, FileImage, Shield, ZoomIn
} from "lucide-react";
import toast from "react-hot-toast";

const STATUS_TABS = ["pending", "assigned", "pending_verification"];

const statusStyle = {
    pending: "bg-amber-50 text-amber-700 border border-amber-100",
    assigned: "bg-blue-50 text-blue-700 border border-blue-100",
    pending_verification: "bg-brand-50 text-brand-700 border border-brand-100",
    completed: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    distributed: "bg-teal-50 text-teal-700 border border-teal-100",
};

const statusLabel = {
    pending: "Pending",
    assigned: "Assigned",
    pending_verification: "Verify Proof",
    completed: "Completed",
    distributed: "Distributed",
};

export default function AidAssignments() {
    const { token } = useContext(AuthContext);

    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("pending");
    const [search, setSearch] = useState("");

    // Volunteer assign modal
    const [assignModal, setAssignModal] = useState(null);
    const [taskDescription, setTaskDescription] = useState("");
    const [volunteers, setVolunteers] = useState([]);
    const [selectedVolunteers, setSelectedVolunteers] = useState([]);
    const [recommendedVolunteers, setRecommendedVolunteers] = useState([]);
    const [loadingRecs, setLoadingRecs] = useState(false);
    const [assigning, setAssigning] = useState(false);

    // Verify proof modal
    const [verifyModal, setVerifyModal] = useState(null);
    const [verifyingId, setVerifyingId] = useState(null); // volunteerId currently being verified
    const [cancellingId, setCancellingId] = useState(null); // id of assignment being cancelled
    const [lightbox, setLightbox] = useState(null); // { url, isVideo }

    // Team view modal
    const [teamModal, setTeamModal] = useState(null);

    const fetchAssignments = async () => {
        try {
            const res = await axios.get("/ngo/assignments");
            setAssignments(res.data);
        } catch {
            toast.error("Failed to load assignments.");
        } finally {
            setLoading(false);
        }
    };

    const fetchVolunteers = async () => {
        try {
            const res = await axios.get("/ngo/volunteers");
            setVolunteers(res.data);
        } catch {
            console.error("Could not load volunteers.");
        }
    };

    useEffect(() => {
        if (token) {
            fetchAssignments();
            fetchVolunteers();
        }
    }, [token]);

    const fetchRecommendations = async (assignmentId) => {
        setLoadingRecs(true);
        setRecommendedVolunteers([]);
        try {
            const res = await axios.get(
                `/volunteer/recommendations?taskId=${assignmentId}&type=AidAssignment`
            );
            setRecommendedVolunteers(res.data);
        } catch {
            // silent
        } finally {
            setLoadingRecs(false);
        }
    };

    const openAssignModal = (assignment) => {
        const preSelected = (assignment.volunteers || []).map((v) => v._id || v);
        setSelectedVolunteers(preSelected);
        setTaskDescription(assignment.taskDescription || "");
        setAssignModal(assignment);
        fetchRecommendations(assignment._id);
    };

    const handleAssignVolunteers = async () => {
        if (selectedVolunteers.length === 0) {
            toast.error("Select at least one volunteer.");
            return;
        }
        setAssigning(true);
        try {
            await axios.patch(`/ngo/assignments/${assignModal._id}/volunteers`, {
                volunteerIds: selectedVolunteers,
                taskDescription,
            });
            toast.success("Volunteers assigned successfully!");
            closeAssignModal();
            fetchAssignments();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to assign.");
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

    const handleVerifyAssignment = async (volunteerId) => {
        if (!verifyModal) return;
        if (verifyingId) return; // block duplicate calls
        const vidStr = volunteerId?.toString();
        setVerifyingId(vidStr);
        try {
            await axios.post(`/ngo/assignments/${verifyModal._id}/verify`, { volunteerId: vidStr });
            toast.success("Volunteer proof verified!");
            setVerifyModal(null);
            fetchAssignments();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to verify.");
        } finally {
            setVerifyingId(null);
        }
    };

    const handleCancelAssignment = async (id) => {
        if (!window.confirm("Are you sure you want to cancel this assignment? This will refund the resources and release the assigned volunteers.")) return;
        setCancellingId(id);
        try {
            await axios.delete(`/ngo/assignments/${id}`);
            toast.success("Assignment cancelled successfully!");
            fetchAssignments();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to cancel assignment.");
        } finally {
            setCancellingId(null);
        }
    };

    const toggleVolunteer = (id) =>
        setSelectedVolunteers((prev) =>
            prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
        );

    const filtered = useMemo(() => {
        let list = assignments.filter((a) => a.status === activeTab);
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(
                (a) =>
                    a.disaster?.title?.toLowerCase().includes(q) ||
                    a.notes?.toLowerCase().includes(q)
            );
        }
        return list;
    }, [assignments, activeTab, search]);

    const counts = useMemo(
        () => ({
            pending: assignments.filter((a) => a.status === "pending").length,
            assigned: assignments.filter((a) => a.status === "assigned").length,
            pending_verification: assignments.filter((a) => a.status === "pending_verification").length,
        }),
        [assignments]
    );

    if (loading)
        return (
            <div className="p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white border rounded-xl p-6 animate-pulse h-48" />
                ))}
            </div>
        );

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Aid Assignments</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                    Manage NGO relief operations and volunteer deployments.
                </p>
            </div>

            {/* Tabs + Search */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
                <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
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
                                tab.charAt(0).toUpperCase() + tab.slice(1)
                            )}
                            <span className={`ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === tab
                                ? "bg-white/20 text-white"
                                : tab === "pending_verification" && counts.pending_verification > 0
                                    ? "bg-brand-100 text-brand-700"
                                    : "bg-gray-100 text-gray-500"
                                }`}>
                                {counts[tab]}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search assignments..."
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
                    <p className="font-medium">No assignments found.</p>
                    <p className="text-xs mt-1">
                        {activeTab === "pending_verification"
                            ? "No assignments are awaiting proof verification."
                            : `There are no ${activeTab} assignments.`}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((assignment) => (
                        <div
                            key={assignment._id}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group max-h-[380px]"
                        >
                            {/* Card Header */}
                            <div className="px-4 py-3 border-b border-gray-50 flex justify-between items-center relative overflow-hidden">
                                <div className="relative z-10 min-w-0">
                                    <h3 className="font-bold text-sm text-gray-800 truncate group-hover:text-brand-600 transition-colors uppercase tracking-tight">
                                        {assignment.disaster?.title || "Aid Assignment"}
                                    </h3>
                                    <p className="text-xs text-gray-400 font-medium flex items-center gap-1 mt-0.5">
                                        <MapPin className="w-3 h-3 text-emerald-500" />
                                        {assignment.disaster?.location || "Location N/A"}
                                    </p>
                                </div>
                                <span className={`relative z-10 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ml-2 ${statusStyle[assignment.status] || "bg-gray-100 text-gray-600"}`}>
                                    {statusLabel[assignment.status] || assignment.status}
                                </span>
                            </div>

                            {/* Card Body */}
                            <div className="px-4 py-3 space-y-2.5 flex-grow overflow-y-auto">
                                {/* Relief Items */}
                                {assignment.items?.length > 0 && (
                                    <div className="bg-orange-50 rounded-lg p-2.5 border border-orange-100">
                                        <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                                            <Package className="w-3 h-3" /> Relief Items
                                        </p>
                                        <div className="flex flex-wrap gap-1">
                                            {assignment.items.slice(0, 4).map((item, idx) => (
                                                <span key={idx} className="text-[10px] font-semibold bg-white border border-orange-200 text-orange-700 px-1.5 py-0.5 rounded">
                                                    {item.quantity}× {item.name}
                                                </span>
                                            ))}
                                            {assignment.items.length > 4 && (
                                                <span className="text-[10px] text-orange-500 font-medium">+{assignment.items.length - 4} more</span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Task Description */}
                                {assignment.taskDescription && (
                                    <div className="bg-gray-50 rounded-lg p-2.5 border">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5 flex items-center gap-1">
                                            <ClipboardList className="w-3 h-3" /> Instructions
                                        </p>
                                        <p className="text-xs text-gray-700 line-clamp-2">{assignment.taskDescription}</p>
                                    </div>
                                )}

                                {/* Notes */}
                                {assignment.notes && (
                                    <p className="text-xs text-gray-500 italic line-clamp-1">{assignment.notes}</p>
                                )}

                                {/* Assigned Volunteers */}
                                <div className="pt-2 border-t border-dashed border-gray-100">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                            <Users className="w-3 h-3 text-brand-500" />
                                            Team ({(assignment.volunteers || []).length})
                                        </div>
                                        {(assignment.volunteers || []).length > 0 && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setTeamModal(assignment); }}
                                                className="text-[10px] text-brand-600 underline font-medium hover:text-brand-800"
                                            >
                                                View Details
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {(assignment.volunteers || []).length > 0 ? (
                                            assignment.volunteers.slice(0, 3).map((v, idx) => (
                                                <span key={idx} className="text-[10px] font-bold bg-brand-50 text-brand-600 px-2 py-0.5 rounded border border-brand-100">
                                                    {v.name || "Unknown"}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-[10px] italic text-gray-400">No volunteers assigned yet</span>
                                        )}
                                        {(assignment.volunteers || []).length > 3 && (
                                            <span className="text-[10px] text-gray-400 font-medium">+{assignment.volunteers.length - 3} more</span>
                                        )}
                                    </div>
                                </div>

                                {/* Evidence count badge (pending_verification) */}
                                {assignment.status === "pending_verification" && assignment.volunteerCompletions?.filter(c => c.status === "pending_verification").length > 0 && (
                                    <div className="flex items-center gap-1.5 bg-brand-50 rounded-lg px-3 py-2 border border-brand-100">
                                        <FileImage className="w-3.5 h-3.5 text-brand-500" />
                                        <span className="text-xs font-semibold text-brand-700">
                                            {assignment.volunteerCompletions.filter(c => c.status === "pending_verification").length} proof{assignment.volunteerCompletions.filter(c => c.status === "pending_verification").length > 1 ? "s" : ""} awaiting review
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Card Footer */}
                            {assignment.status === "pending_verification" ? (
                                <div className="px-4 py-3 border-t bg-brand-50 flex gap-2">
                                    <button
                                        onClick={() => setVerifyModal(assignment)}
                                        className="flex-1 bg-brand-600 text-white py-2 rounded-lg hover:bg-brand-700 transition flex items-center justify-center gap-1.5 text-xs font-semibold shadow-sm"
                                    >
                                        <Eye className="w-3.5 h-3.5" />
                                        Verify Proofs
                                    </button>
                                    <button
                                        onClick={() => openAssignModal(assignment)}
                                        className="flex-1 bg-white border border-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-1.5 text-xs font-semibold"
                                    >
                                        <Users className="w-3.5 h-3.5" /> Manage
                                    </button>
                                </div>
                            ) : assignment.status === "completed" ? (
                                <div className="px-4 py-3 border-t bg-emerald-50 flex items-center justify-center gap-2 text-emerald-700 text-sm font-semibold">
                                    <CheckCircle className="w-4 h-4" /> Aid Mission Completed
                                </div>
                            ) : (
                                <div className="px-4 py-3 border-t bg-gray-50 flex gap-2">
                                    <button
                                        onClick={() => openAssignModal(assignment)}
                                        className="flex-1 bg-brand-600 text-white py-2 rounded-lg hover:bg-brand-700 transition flex items-center justify-center gap-1.5 text-xs font-semibold shadow-sm"
                                    >
                                        <Users className="w-3.5 h-3.5" />
                                        {assignment.volunteers?.length > 0 ? "Manage Volunteers" : "Assign Volunteers"}
                                    </button>
                                    <button
                                        onClick={() => handleCancelAssignment(assignment._id)}
                                        disabled={cancellingId === assignment._id}
                                        className="px-3 bg-red-50 border border-red-100 text-red-600 py-2 rounded-lg hover:bg-red-100 transition flex items-center justify-center gap-1.5 text-xs font-semibold shadow-sm"
                                    >
                                        {cancellingId === assignment._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* ── ASSIGN VOLUNTEERS MODAL ──────────────────────────────────────────── */}
            {assignModal && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl relative max-h-[90vh] overflow-y-auto">
                        <button onClick={closeAssignModal} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
                            <X className="w-5 h-5" />
                        </button>

                        <h2 className="text-xl font-bold mb-1">Assign Volunteers</h2>
                        <p className="text-sm text-gray-500 mb-4">
                            Aid: <span className="font-semibold text-gray-700">{assignModal.disaster?.title || "Relief Mission"}</span>
                        </p>

                        {/* Task Description */}
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                                <ClipboardList className="w-4 h-4 text-brand-500" /> Task Instructions (for volunteers)
                            </label>
                            <textarea
                                placeholder="Describe the delivery location, items to carry, and any special instructions..."
                                value={taskDescription}
                                onChange={(e) => setTaskDescription(e.target.value)}
                                rows={3}
                                className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                            />
                        </div>

                        {/* Relief items summary */}
                        {assignModal.items?.length > 0 && (
                            <div className="mb-4 bg-orange-50 rounded-lg p-3 border border-orange-100">
                                <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider mb-1">Relief Items to Deliver</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {assignModal.items.map((item, idx) => (
                                        <span key={idx} className="text-xs font-semibold bg-white border border-orange-200 text-orange-700 px-2 py-0.5 rounded-lg">
                                            {item.quantity}× {item.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="border rounded-lg max-h-64 overflow-y-auto">
                            {loadingRecs ? (
                                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                                    <Loader2 className="w-5 h-5 animate-spin mb-2" />
                                    <span className="text-xs">Finding best matches…</span>
                                </div>
                            ) : recommendedVolunteers.length > 0 ? (
                                <div className="p-2 space-y-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 pt-1 mb-2">
                                        AI Recommended
                                    </p>
                                    {recommendedVolunteers.map((rec, idx) => {
                                        const vid = rec.user?._id || rec.user;
                                        const checked = selectedVolunteers.includes(vid);
                                        return (
                                            <label
                                                key={rec._id}
                                                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${checked ? "bg-brand-50 border-brand-200" : "hover:bg-gray-50 border-gray-100"}`}
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
                                                            <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full shrink-0 ml-2">Top Match</span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                                                        {rec.distance !== Infinity && <span><MapPin className="inline w-3 h-3" /> {rec.distance} km</span>}
                                                        {rec.matchScore > 0 && <span><CheckCircle className="inline w-3 h-3 text-emerald-500" /> {rec.matchScore}% match</span>}
                                                    </div>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            ) : volunteers.filter((v) => !v.isProfileIncomplete).length > 0 ? (
                                <div className="p-2 space-y-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 pt-1 mb-2">
                                        All Volunteers
                                    </p>
                                    {volunteers.filter((v) => !v.isProfileIncomplete).map((vol) => {
                                        const vid = vol.user?._id || vol._id;
                                        const checked = selectedVolunteers.includes(vid);
                                        return (
                                            <label
                                                key={vol._id}
                                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${checked ? "bg-brand-50 border-brand-200" : "hover:bg-gray-50 border-gray-100"}`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={() => toggleVolunteer(vid)}
                                                    className="rounded text-brand-600 w-4 h-4"
                                                />
                                                <span className="text-sm font-medium text-gray-700">
                                                    {vol.user?.name || "Unknown"} {vol.available ? "" : "• Busy"}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="py-10 flex flex-col items-center text-gray-400">
                                    <Users className="w-8 h-8 mb-2 opacity-30" />
                                    <p className="text-sm">No volunteers found.</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                            <span className="text-xs text-gray-400">{selectedVolunteers.length} selected</span>
                            <div className="flex gap-2">
                                <button onClick={closeAssignModal} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition">Cancel</button>
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

            {/* ── VERIFY PROOF MODAL ───────────────────────────────────────────────── */}
            {verifyModal && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto">
                        <button onClick={() => setVerifyModal(null)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center">
                                <Eye className="w-5 h-5 text-brand-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-800">Verify Volunteer Proof</h2>
                                <p className="text-xs text-gray-500">{verifyModal.disaster?.title}</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {verifyModal.volunteerCompletions?.filter(c => c.status === "pending_verification").length > 0 ? (
                                verifyModal.volunteerCompletions
                                    .filter(c => c.status === "pending_verification")
                                    .map((completion, idx) => {
                                        // Find volunteer details
                                        const volunteerInfo = verifyModal.volunteers?.find(
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
                                                                    <div key={i} className="rounded-lg overflow-hidden border border-gray-200 bg-black relative aspect-video" onClick={(e) => { e.stopPropagation(); setLightbox({ url: `/${url}`, isVideo: true }); }}>
                                                                        <video src={`/${url}`} className="w-full h-full object-cover cursor-pointer" />
                                                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                                            <span className="bg-black/60 text-white px-2 py-1 rounded-md text-[10px] font-medium backdrop-blur-sm">Play</span>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <button key={i} onClick={() => setLightbox({ url: `/${url}`, isVideo: false })}
                                                                        className="block rounded-lg overflow-hidden border border-gray-200 hover:opacity-90 transition relative group/thumb w-full h-full text-left aspect-video">
                                                                        <img src={`/${url}`} alt={`Evidence ${i + 1}`} className="w-full object-cover h-full" />
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
                                                    onClick={() => handleVerifyAssignment(completion.volunteerId)}
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

            {/* ── TEAM MODAL ───────────────────────────────────────────────────────── */}
            {teamModal && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl relative">
                        <button onClick={() => setTeamModal(null)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
                            <X className="w-5 h-5" />
                        </button>
                        <h2 className="text-lg font-bold mb-1">Deployment Team</h2>
                        <p className="text-xs text-gray-500 mb-4">{teamModal.disaster?.title}</p>
                        <div className="space-y-2">
                            {(teamModal.volunteers || []).map((v, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">{v.name || "Unknown"}</p>
                                        <p className="text-xs text-gray-400">{v.email}</p>
                                    </div>
                                    {v.phone && v.phone !== "N/A" && (
                                        <span className="text-xs text-brand-600 font-medium">{v.phone}</span>
                                    )}
                                </div>
                            ))}
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
