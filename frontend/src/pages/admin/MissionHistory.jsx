import React, { useState, useEffect, useContext } from "react";
import axios from "../../api/axios";
import { AuthContext } from "../../context/AuthContext";
import { MapPin, CheckCircle, Calendar, AlertCircle, Users, Building2, Package, Siren } from "lucide-react";
import toast from "react-hot-toast";

export default function MissionHistory() {
    const { token } = useContext(AuthContext);
    const [rescueMissions, setRescueMissions] = useState([]);
    const [aidAssignments, setAidAssignments] = useState([]);
    const [resolvedDisasters, setResolvedDisasters] = useState([]);
    const [activeTab, setActiveTab] = useState("rescue"); // "rescue", "aid", or "disaster"
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) fetchHistory();
    }, [token]);

    const fetchHistory = async () => {
        try {
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };

            const [rescueRes, aidRes, disasterRes] = await Promise.all([
                axios.get("/admin/mission-history", config),
                axios.get("/admin/aid-history", config),
                axios.get("/admin/disaster-history", config)
            ]);
            setRescueMissions(rescueRes.data);
            setAidAssignments(aidRes.data);
            setResolvedDisasters(disasterRes.data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch mission history");
        } finally {
            setLoading(false);
        }
    };

    const totalMissions = rescueMissions.length + aidAssignments.length + resolvedDisasters.length;
    const totalVolunteers = new Set([
        ...rescueMissions.flatMap(m => m.assignedVolunteers?.map(v => v._id) || []),
        ...aidAssignments.flatMap(a => a.volunteers?.map(v => v._id) || [])
    ]).size;

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
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Platform History</h1>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-white rounded-lg p-4 border shadow-sm">
                    <div className="text-sm text-gray-500">Total Completed</div>
                    <div className="text-2xl font-bold text-gray-800">{totalMissions}</div>
                </div>
                <div className="bg-white rounded-lg p-4 border shadow-sm">
                    <div className="text-sm text-gray-500">Rescue Missions</div>
                    <div className="text-2xl font-bold text-orange-600">{rescueMissions.length}</div>
                </div>
                <div className="bg-white rounded-lg p-4 border shadow-sm">
                    <div className="text-sm text-gray-500">Aid Distributions</div>
                    <div className="text-2xl font-bold text-green-600">{aidAssignments.length}</div>
                </div>
                <div className="bg-white rounded-lg p-4 border shadow-sm">
                    <div className="text-sm text-gray-500">Resolved Disasters</div>
                    <div className="text-2xl font-bold text-purple-600">{resolvedDisasters.length}</div>
                </div>
                <div className="bg-white rounded-lg p-4 border shadow-sm">
                    <div className="text-sm text-gray-500">Total Volunteers</div>
                    <div className="text-2xl font-bold text-brand-600">{totalVolunteers}</div>
                </div>
            </div>

            {/* Tabs */}
            <div className="mb-6 flex gap-2 border-b">
                <button
                    onClick={() => setActiveTab("rescue")}
                    className={`px-6 py-3 font-medium transition-colors ${activeTab === "rescue"
                        ? "border-b-2 border-orange-600 text-orange-600"
                        : "text-gray-500 hover:text-gray-700"
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Siren className="w-4 h-4" />
                        Rescue Missions ({rescueMissions.length})
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab("aid")}
                    className={`px-6 py-3 font-medium transition-colors ${activeTab === "aid"
                        ? "border-b-2 border-green-600 text-green-600"
                        : "text-gray-500 hover:text-gray-700"
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Aid Distributions ({aidAssignments.length})
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab("disaster")}
                    className={`px-6 py-3 font-medium transition-colors ${activeTab === "disaster"
                        ? "border-b-2 border-purple-600 text-purple-600"
                        : "text-gray-500 hover:text-gray-700"
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Resolved Disasters ({resolvedDisasters.length})
                    </div>
                </button>
            </div>

            {/* Content */}
            {activeTab === "rescue" ? (
                <RescueMissionsList missions={rescueMissions} />
            ) : activeTab === "aid" ? (
                <AidAssignmentsList assignments={aidAssignments} />
            ) : (
                <ResolvedDisastersList disasters={resolvedDisasters} />
            )}
        </div>
    );
}

function RescueMissionsList({ missions }) {
    if (missions.length === 0) {
        return (
            <div className="bg-white rounded-xl p-12 text-center border">
                <p className="text-gray-500">No completed rescue missions found.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-6">
            {missions.map((mission) => (
                <div
                    key={mission._id}
                    className="bg-white rounded-xl p-6 shadow-sm border flex flex-col gap-4"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg text-gray-800">{mission.title}</h3>
                        <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-700 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Completed
                        </span>
                    </div>

                    {mission.description && (
                        <p className="text-gray-600">{mission.description}</p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                            <Building2 className="w-4 h-4" />
                            <span>{mission.organization?.name || "Unknown Org"}</span>
                        </div>
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

                    {mission.assignedVolunteers && mission.assignedVolunteers.length > 0 && (
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Users className="w-4 h-4" />
                            <span>Volunteers: {mission.assignedVolunteers.length}</span>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

function AidAssignmentsList({ assignments }) {
    if (assignments.length === 0) {
        return (
            <div className="bg-white rounded-xl p-12 text-center border">
                <p className="text-gray-500">No distributed aid assignments found.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-6">
            {assignments.map((assignment) => (
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
                        <div className="flex items-center gap-1">
                            <Building2 className="w-4 h-4" />
                            <span>{assignment.ngo?.name || "Unknown NGO"}</span>
                        </div>
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
                            <span>Volunteers: {assignment.volunteers.length}</span>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

function ResolvedDisastersList({ disasters }) {
    if (disasters.length === 0) {
        return (
            <div className="bg-white rounded-xl p-12 text-center border">
                <p className="text-gray-500">No resolved disasters found.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-6">
            {disasters.map((disaster) => (
                <div
                    key={disaster._id}
                    className="bg-white rounded-xl p-6 shadow-sm border flex flex-col gap-4"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg text-gray-800">{disaster.title}</h3>
                        <span className="px-2 py-1 rounded text-xs font-semibold bg-purple-100 text-purple-700 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Resolved
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                            ${disaster.severity === 'high' ? 'bg-red-100 text-red-700' :
                                disaster.severity === 'medium' ? 'bg-orange-100 text-orange-700' :
                                    'bg-green-100 text-green-700'}`}>
                            {disaster.severity}
                        </span>
                    </div>

                    {disaster.description && (
                        <p className="text-gray-600">{disaster.description}</p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{disaster.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>Reported: {new Date(disaster.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            <span>Resolved: {new Date(disaster.updatedAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                    
                    {disaster.reportedBy && (
                        <div className="text-xs text-gray-400">
                            Reported by: {disaster.reportedBy.name} ({disaster.reportedBy.email})
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
