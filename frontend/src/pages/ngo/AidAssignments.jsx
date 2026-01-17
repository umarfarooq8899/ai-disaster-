import React, { useState, useEffect } from "react";
import axios from "../../api/axios";
import { HeartHandshake, Package, User, CheckCircle, Clock, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

export default function AidAssignments() {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);

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

    const handleStatusUpdate = async (id) => {
        try {
            await axios.patch(`/ngo/assignments/${id}/status`);
            toast.success("Status updated to Distributed");
            fetchAssignments();
        } catch (err) {
            toast.error("Failed to update status");
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
                <Link
                    to="/dashboard/ngo/assignments/new"
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm"
                >
                    <Plus className="w-5 h-5" />
                    New Deployment
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {loading ? (
                    <div className="col-span-full py-12 text-center text-gray-400">Loading deployments...</div>
                ) : assignments.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-gray-400">No aid has been assigned yet.</div>
                ) : (
                    assignments.map(ass => (
                        <div key={ass._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                            <div className="p-6 border-b border-gray-50 flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-800">{ass.disaster?.title}</h3>
                                    <p className="text-sm text-gray-500">{ass.disaster?.location}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${ass.status === "distributed" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                                    }`}>
                                    {ass.status}
                                </span>
                            </div>

                            <div className="p-6 grid grid-cols-2 gap-6 flex-grow">
                                <div>
                                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase mb-3">
                                        <Package className="w-3 h-3" />
                                        Resources Sent
                                    </div>
                                    <ul className="space-y-2">
                                        {ass.items.map((item, idx) => (
                                            <li key={idx} className="text-sm text-gray-700 flex justify-between">
                                                <span>{item.resource?.name || "Deleted Resource"}</span>
                                                <span className="font-bold">x {item.quantity}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase mb-3">
                                        <User className="w-3 h-3" />
                                        Ground Team
                                    </div>
                                    <ul className="space-y-1">
                                        {ass.volunteers.map(vol => (
                                            <li key={vol._id} className="text-sm text-gray-700 truncate">
                                                {vol.name}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {ass.status === "assigned" && (
                                <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
                                    <button
                                        onClick={() => handleStatusUpdate(ass._id)}
                                        className="text-blue-600 font-semibold text-sm hover:underline"
                                    >
                                        Mark as All Distributed
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
