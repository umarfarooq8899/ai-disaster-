import React, { useState, useEffect } from "react";
import axios from "../../api/axios";
import { MapPin, CheckCircle, Calendar, AlertCircle, Package, Users } from "lucide-react";
import toast from "react-hot-toast";

export default function AidHistory() {
    const [aidHistory, setAidHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await axios.get("/ngo/assignment-history");
            setAidHistory(res.data);
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.error || err.response?.data?.message || err.message || "Failed to fetch aid history");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white rounded-xl p-6 border animate-pulse h-32" />
                ))}
            </div>
        );
    }

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Aid Distribution History</h1>

            {aidHistory.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center border">
                    <p className="text-gray-500">No distributed aid assignments found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {aidHistory.map((assignment) => (
                        <div
                            key={assignment._id}
                            className="bg-white rounded-xl p-6 shadow-sm border flex flex-col gap-4"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-700 flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" /> Distributed
                                </span>
                            </div>

                            {assignment.disaster && (
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertCircle className="w-5 h-5 text-red-500" />
                                    <span className="font-semibold text-lg text-gray-800">
                                        {assignment.disaster.title}
                                    </span>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                {assignment.disaster?.location && (
                                    <div className="flex items-center gap-1">
                                        <MapPin className="w-4 h-4" />
                                        <span>{assignment.disaster.location}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>{new Date(assignment.updatedAt).toLocaleDateString()}</span>
                                </div>
                            </div>

                            {assignment.items && assignment.items.length > 0 && (
                                <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Package className="w-4 h-4 text-gray-600" />
                                        <span className="text-sm font-semibold text-gray-700">Items Distributed:</span>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                        {assignment.items.map((item, idx) => (
                                            <div key={idx} className="text-sm text-gray-600">
                                                <span className="font-medium">{item.name || item.resource?.name}</span>
                                                <span className="text-gray-400 ml-1">× {item.quantity}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {assignment.volunteers && assignment.volunteers.length > 0 && (
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                    <Users className="w-4 h-4" />
                                    <span>Volunteers involved: {assignment.volunteers.length}</span>
                                </div>
                            )}

                            {assignment.notes && (
                                <p className="text-sm text-gray-600 italic mt-2">
                                    Note: {assignment.notes}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
