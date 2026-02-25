import React, { useState, useEffect } from "react";
import axios from "../../api/axios";
import { HeartHandshake, Package, User, CheckCircle, Calculator, MapPin, X } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function AidAssignments() {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal States
    const [volunteers, setVolunteers] = useState([]);
    const [selectedVolunteers, setSelectedVolunteers] = useState([]);
    const [assignModal, setAssignModal] = useState(null);
    const [teamModal, setTeamModal] = useState(null);

    const fetchAssignments = async () => {
        try {
            const res = await axios.get("/ngo/assignments");
            setAssignments(res.data);
        } catch (err) {
            toast.error("Failed to load assignments");
        } finally {
            setLoading(false);
        }
    };

    const fetchVolunteers = async () => {
        try {
            const res = await axios.get("/ngo/volunteers");
            setVolunteers(res.data);
        } catch (err) {
            console.error("Failed to fetch volunteers", err);
        }
    };

    useEffect(() => {
        fetchAssignments();
        fetchVolunteers();
    }, []);

    const handleAutoAssign = async () => {
        const loadingToast = toast.loading("Auto-assigning volunteers...");
        try {
            const res = await axios.post("/volunteer/admin/auto-assign");
            if (res.data.totalAssignments > 0) {
                toast.success(res.data.message, { id: loadingToast });
            } else {
                toast.error(res.data.message, { id: loadingToast });
            }
            fetchAssignments();
        } catch (err) {
            toast.error(err.response?.data?.message || "Auto-assignment failed", { id: loadingToast });
        }
    };

    const handleAssignVolunteers = async () => {
        try {
            await axios.patch(`/ngo/assignments/${assignModal._id}/volunteers`, {
                volunteerIds: selectedVolunteers
            });
            toast.success("Volunteers assigned successfully");
            setAssignModal(null);
            setSelectedVolunteers([]);
            fetchAssignments();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to assign volunteers");
        }
    };

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <Toaster />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Aid Assignments</h1>
                    <p className="text-gray-500 text-sm">Track relief distribution and ground team deployments</p>
                </div>
                <button
                    onClick={handleAutoAssign}
                    className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition shadow-md font-medium"
                >
                    <Calculator className="w-5 h-5" />
                    Auto Assign
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {loading ? (
                    [...Array(6)].map((_, i) => (
                        <div key={i} className="bg-white h-64 rounded-2xl border border-gray-100 animate-pulse" />
                    ))
                ) : assignments.length === 0 ? (
                    <div className="col-span-full py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-gray-400">
                        <HeartHandshake className="w-12 h-12 mb-4 opacity-20" />
                        <p className="font-medium">No active deployments at the moment</p>
                        <p className="text-xs">Assignments will appear here once you deploy aid to a disaster area.</p>
                    </div>
                ) : (
                    assignments.map(ass => (
                        <div key={ass._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group">
                            {/* Card Header */}
                            <div className="p-6 border-b border-gray-50 flex justify-between items-start relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:rotate-12 transition-transform duration-500">
                                    <HeartHandshake className="w-24 h-24" />
                                </div>

                                <div className="relative z-10 min-w-0">
                                    <h3 className="font-bold text-lg text-gray-800 truncate group-hover:text-brand-600 transition-colors uppercase tracking-tight">
                                        {ass.disaster?.title || "Pending Disaster Data"}
                                    </h3>
                                    <p className="text-xs text-gray-400 font-medium flex items-center gap-1 mt-1 uppercase">
                                        <MapPin className="w-3 h-3 text-emerald-500" /> {ass.disaster?.location || "Location TBD"}
                                    </p>
                                </div>
                                <span className={`relative z-10 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${ass.status === "distributed"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                    : ass.status === "pending"
                                        ? "bg-amber-50 text-amber-700 border border-amber-100"
                                        : "bg-brand-50 text-brand-700 border border-brand-100"
                                    }`}>
                                    {ass.status}
                                </span>
                            </div>

                            {/* Card Body */}
                            <div className="p-6 space-y-6 flex-grow">
                                {/* Inventory Section */}
                                <div>
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                                        <Package className="w-3 h-3 text-emerald-500" />
                                        Relief Supplies
                                    </div>
                                    <div className="grid grid-cols-1 gap-2">
                                        {(ass.items || []).map((item, idx) => (
                                            <div key={idx} className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 flex justify-between items-center transition-colors hover:bg-slate-50">
                                                <span className="text-sm font-semibold text-slate-700">{item.resource?.name || item.name || "Resource"}</span>
                                                <span className="text-xs font-black bg-white px-2 py-1 rounded shadow-sm text-emerald-600 border border-slate-100">x{item.quantity}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Team Section */}
                                <div className="pt-4 border-t border-dashed border-gray-100">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                            <User className="w-3 h-3 text-brand-500" />
                                            Deployment Team
                                        </div>
                                        {ass.volunteers && ass.volunteers.length > 0 && (
                                            <button
                                                onClick={() => setTeamModal(ass)}
                                                className="text-[10px] font-bold text-brand-600 hover:text-brand-800 underline uppercase tracking-widest"
                                            >
                                                Details
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {ass.volunteers && ass.volunteers.length > 0 ? (
                                            ass.volunteers.map(vol => (
                                                <span key={vol._id} className="text-[10px] font-bold bg-brand-50 text-brand-600 px-2.5 py-1 rounded-lg border border-brand-100">
                                                    {vol.name}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-[10px] italic text-gray-400">No volunteers assigned</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Card Footer / Actions */}
                            {ass.status !== 'distributed' && (
                                <div className="p-4 border-t bg-gray-50 flex flex-col gap-2">
                                    <button
                                        onClick={() => {
                                            setAssignModal(ass);
                                            setSelectedVolunteers(ass.volunteers?.map(v => v._id) || []);
                                        }}
                                        className="w-full bg-brand-600 text-white py-2 rounded-lg hover:bg-brand-700 transition flex items-center justify-center gap-2 text-sm font-semibold"
                                    >
                                        <User className="w-4 h-4" /> Assign Volunteers
                                    </button>
                                    <button
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            try {
                                                await axios.patch(`/ngo/assignments/${ass._id}/status`);
                                                toast.success("Marked as Distributed");
                                                fetchAssignments();
                                            } catch (err) {
                                                toast.error("Failed to update status");
                                            }
                                        }}
                                        className="w-full bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition flex items-center justify-center gap-2 text-sm font-semibold"
                                    >
                                        <CheckCircle className="w-4 h-4" /> Mark as Distributed
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* ASSIGN VOLUNTEERS MODAL */}
            {assignModal && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center backdrop-blur-sm">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl relative">
                        <button
                            onClick={() => {
                                setAssignModal(null);
                                setSelectedVolunteers([]);
                            }}
                            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h2 className="text-xl font-bold mb-4">Assign Volunteers</h2>
                        <p className="text-sm text-gray-600 mb-4">Disaster: {assignModal.disaster?.title}</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Select Volunteers</label>
                                <div className="border rounded-lg p-3 max-h-60 overflow-y-auto space-y-2">
                                    {volunteers.filter(v => !v.isProfileIncomplete).map((volunteer) => (
                                        <label
                                            key={volunteer._id}
                                            className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedVolunteers.includes(volunteer.user?._id || volunteer._id)}
                                                onChange={(e) => {
                                                    const volunteerId = volunteer.user?._id || volunteer._id;
                                                    if (e.target.checked) {
                                                        setSelectedVolunteers([...selectedVolunteers, volunteerId]);
                                                    } else {
                                                        setSelectedVolunteers(selectedVolunteers.filter(id => id !== volunteerId));
                                                    }
                                                }}
                                                className="rounded"
                                            />
                                            <span className="text-sm">
                                                {volunteer.user?.name || volunteer.name || "Unknown"}
                                            </span>
                                        </label>
                                    ))}
                                    {volunteers.filter(v => !v.isProfileIncomplete).length === 0 && (
                                        <p className="text-sm text-gray-500">No volunteers available</p>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={handleAssignVolunteers}
                                disabled={selectedVolunteers.length === 0}
                                className="w-full bg-brand-600 text-white py-2 rounded-lg hover:bg-brand-700 disabled:opacity-50 font-semibold"
                            >
                                Assign {selectedVolunteers.length} Volunteer(s)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TEAM DETAILS MODAL */}
            {teamModal && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center backdrop-blur-sm">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl relative">
                        <button
                            onClick={() => setTeamModal(null)}
                            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h2 className="text-xl font-bold mb-4">Deployment Team</h2>
                        <p className="text-sm text-gray-600 mb-6 uppercase tracking-wider font-semibold">
                            {teamModal.disaster?.title}
                        </p>

                        <div className="space-y-4">
                            {teamModal.volunteers.map((vol) => (
                                <div key={vol._id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold">
                                        {vol.name.charAt(0)}
                                    </div>
                                    <div className="flex-grow">
                                        <h4 className="font-bold text-gray-800">{vol.name}</h4>
                                        <p className="text-xs text-gray-500">{vol.email}</p>
                                        <p className="text-xs text-brand-600 font-bold mt-1">{vol.phone}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => setTeamModal(null)}
                            className="w-full mt-6 bg-slate-100 text-slate-700 py-2 rounded-lg hover:bg-slate-200 transition font-bold"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
