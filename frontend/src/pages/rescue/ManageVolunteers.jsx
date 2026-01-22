import React, { useEffect, useState, useContext } from "react";
import axios from "../../api/axios";
import { AuthContext } from "../../context/AuthContext";
import { Users, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

export default function ManageVolunteers() {
    const { user } = useContext(AuthContext);
    const [volunteers, setVolunteers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchVolunteers = async () => {
        try {
            const endpoint = user?.role === "ngo_coordinator" ? "/ngo/volunteers" : "/rescue/volunteer-management";
            const res = await axios.get(endpoint);
            setVolunteers(res.data);
        } catch (err) {
            toast.error("Failed to load volunteers");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVolunteers();
    }, []);

    const handleAutoAssign = async () => {
        try {
            const res = await axios.post("/volunteer/admin/auto-assign");
            toast.success(res.data.message);
            fetchVolunteers();
        } catch (err) {
            toast.error("Auto-assignment failed");
        }
    };

    if (loading) return <div className="p-8 animate-pulse text-gray-500">Loading volunteers...</div>;

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
                        <Users className="w-6 h-6 text-brand-600" />
                        Manage Volunteers
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Track and assign volunteers registered to your organization.
                    </p>
                </div>
                <button
                    onClick={handleAutoAssign}
                    className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition flex items-center gap-2 shadow-sm"
                >
                    <CheckCircle className="w-4 h-4" />
                    Auto-Assign to Pending Missions
                </button>
            </header>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
                        <tr>
                            <th className="px-6 py-4">Name</th>
                            <th className="px-6 py-4">Skills</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Current Task</th>
                            <th className="px-6 py-4">Location</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {volunteers.map((vol) => (
                            <tr key={vol._id} className="hover:bg-gray-50 transition">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-800">{vol.user?.name || "Unknown"}</div>
                                    <div className="text-xs text-gray-500">{vol.user?.email}</div>
                                    {vol.isProfileIncomplete && (
                                        <span className="text-[10px] text-red-500 font-bold border border-red-200 px-1 rounded ml-1">
                                            INCOMPLETE
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1">
                                        {vol.skills?.length > 0 ? vol.skills.map((skill) => (
                                            <span key={skill} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] uppercase font-bold">
                                                {skill}
                                            </span>
                                        )) : <span className="text-xs text-gray-400">No skills listed</span>}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {vol.available ? (
                                        <span className="flex items-center gap-1 text-green-600 font-medium">
                                            <CheckCircle className="w-3 h-3" /> Available
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-orange-500 font-medium">
                                            <AlertTriangle className="w-3 h-3" /> {vol.isProfileIncomplete ? "Pending Setup" : "Busy"}
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    {vol.currentTask ? (
                                        <div>
                                            <div className="text-gray-800">{vol.currentTask.title}</div>
                                            <div className="text-[10px] text-brand-600 uppercase font-bold">{vol.currentTask.status}</div>
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 italic">None</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-gray-600">
                                    {vol.city || "N/A"}, {vol.province || ""}
                                </td>
                            </tr>
                        ))}
                        {volunteers.length === 0 && (
                            <tr>
                                <td colSpan="5" className="px-6 py-8 text-center text-gray-500 italic">
                                    No volunteers registered for your organization yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
