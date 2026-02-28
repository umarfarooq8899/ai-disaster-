import React, { useState, useEffect } from "react";
import axiosInstance from "../../api/axios";
import { MapPin, CheckCircle, Calendar, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function VolunteerHistory() {
    const [missions, setMissions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await axiosInstance.get("/volunteer/my-missions");
            // Filter for completed missions only
            const completedMissions = res.data.filter(m => m.status === "completed");
            setMissions(completedMissions);
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch mission history");
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
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Mission History</h1>

            {missions.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center border">
                    <p className="text-gray-500">No completed missions found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {missions.map((mission) => (
                        <div
                            key={mission._id}
                            className="bg-white rounded-xl p-6 shadow-sm border flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="font-semibold text-lg text-gray-800">{mission.title}</h3>
                                    <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-700 flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3" /> Completed
                                    </span>
                                </div>

                                <p className="text-gray-600 mb-2">{mission.description}</p>

                                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                    <div className="flex items-center gap-1">
                                        <MapPin className="w-4 h-4" />
                                        <span>{mission.location}</span>
                                    </div>
                                    {mission.disaster && (
                                        <div className="flex items-center gap-1">
                                            <AlertCircle className="w-4 h-4" />
                                            <span>{mission.disaster.title}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        <span>{new Date(mission.updatedAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
