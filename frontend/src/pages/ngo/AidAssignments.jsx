import React, { useState, useEffect } from "react";
import axios from "../../api/axios";
import { HeartHandshake, Package, User, Plus, Send, Calculator, X, MapPin } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function AidAssignments() {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);

    // Update Modal State
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [logForm, setLogForm] = useState({
        updateType: "food",
        description: "",
        metricValue: 0
    });

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

    useEffect(() => {
        fetchAssignments();
    }, []);

    const handleAutoAssign = async () => {
        const loadingToast = toast.loading("Auto-assigning volunteers...");
        try {
            const res = await axios.post("/volunteer/admin/auto-assign");
            toast.success(res.data.message, { id: loadingToast });
            fetchAssignments();
        } catch (err) {
            toast.error(err.response?.data?.message || "Auto-assignment failed", { id: loadingToast });
        }
    };

    // REMOVED: handleLogSubmit as it's now for volunteers only

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
                    className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition shadow-md font-medium"
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
                            <div className="p-6 border-b border-gray-50 flex justify-between items-start relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:rotate-12 transition-transform duration-500">
                                    <HeartHandshake className="w-24 h-24" />
                                </div>

                                <div className="relative z-10 min-w-0">
                                    <h3 className="font-bold text-lg text-gray-800 truncate group-hover:text-emerald-700 transition-colors uppercase tracking-tight">
                                        {ass.disaster?.title || "Pending Disaster Data"}
                                    </h3>
                                    <p className="text-xs text-gray-400 font-medium flex items-center gap-1 mt-1 uppercase">
                                        <MapPin className="w-3 h-3 text-emerald-500" /> {ass.disaster?.location || "Location TBD"}
                                    </p>
                                </div>
                                <span className={`relative z-10 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${ass.status === "distributed"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                    : "bg-brand-50 text-brand-700 border border-brand-100"
                                    }`}>
                                    {ass.status}
                                </span>
                            </div>

                            <div className="p-6 space-y-6 flex-grow">
                                <div>
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                                        <Package className="w-3 h-3 text-emerald-500" />
                                        Inventory Dispatched
                                    </div>
                                    <div className="grid grid-cols-1 gap-2">
                                        {(ass.items || []).map((item, idx) => item && (
                                            <div key={idx} className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 flex justify-between items-center transition-colors hover:bg-slate-50">
                                                <span className="text-sm font-semibold text-slate-700">{item.resource?.name || item.name || "Relief Supply"}</span>
                                                <span className="text-xs font-black bg-white px-2 py-1 rounded shadow-sm text-emerald-600 border border-slate-100">x{item.quantity}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {ass.volunteers && ass.volunteers.length > 0 && (
                                    <div className="pt-4 border-t border-dashed border-gray-100">
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                                            <User className="w-3 h-3 text-brand-500" />
                                            Deployment Team
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {(ass.volunteers).map(vol => vol && (
                                                <span key={vol._id} className="text-[10px] font-bold bg-brand-50 text-brand-600 px-2.5 py-1 rounded-lg border border-brand-100">
                                                    {vol.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {ass.volunteers && ass.volunteers.length > 0 && (
                                <div className="p-4 bg-slate-900 border-t border-slate-800 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Team currently on site</span>
                                </div>
                            )}

                            {ass.status !== 'distributed' && (
                                <div className="p-4 border-t bg-gray-50 flex justify-center">
                                    <button
                                        onClick={async (e) => {
                                            e.stopPropagation(); // Prevent card click
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

            {/* REMOVED: STATUS UPDATE MODAL (Now for volunteers only) */}
        </div>
    );
}
