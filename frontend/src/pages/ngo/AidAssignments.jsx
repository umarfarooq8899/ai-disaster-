import React, { useState, useEffect } from "react";
import axios from "../../api/axios";
import { HeartHandshake, Package, User, Plus, Send, Calculator, X } from "lucide-react";
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

    const handleLogSubmit = async () => {
        try {
            const payload = {
                assignmentId: selectedAssignment._id,
                updateType: logForm.updateType,
                description: logForm.description,
                metrics: logForm.metricValue > 0 ? { count: logForm.metricValue } : {}
            };

            await axios.post("/ngo/updates", payload);
            toast.success("Status update posted successfully");
            setSelectedAssignment(null);
            setLogForm({ updateType: "food", description: "", metricValue: 0 });
        } catch (err) {
            toast.error("Failed to post update");
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
                                                <span>{item.resource?.name || "Resource"}</span>
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

                            <div className="p-4 bg-gray-50 border-t border-gray-100">
                                <button
                                    onClick={() => setSelectedAssignment(ass)}
                                    className="w-full bg-slate-900 text-white py-2 rounded-lg hover:bg-slate-800 transition flex items-center justify-center gap-2"
                                >
                                    <Send className="w-4 h-4" /> Post Update
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* STATUS UPDATE MODAL */}
            {selectedAssignment && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center backdrop-blur-sm">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl relative">
                        <button
                            onClick={() => setSelectedAssignment(null)}
                            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h2 className="text-xl font-bold mb-4">Post Detailed Update</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Update Type</label>
                                <select
                                    className="w-full border rounded p-2"
                                    value={logForm.updateType}
                                    onChange={(e) => setLogForm({ ...logForm, updateType: e.target.value })}
                                >
                                    <option value="food">Food Distribution</option>
                                    <option value="medical">Medical Aid</option>
                                    <option value="shelter">Shelter Setup</option>
                                    <option value="logistics">Logistics</option>
                                    <option value="other">General Update</option>
                                </select>
                            </div>

                            {['food', 'medical', 'shelter'].includes(logForm.updateType) && (
                                <div>
                                    <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                                        <Calculator className="w-4 h-4" />
                                        {logForm.updateType === 'food' ? 'Total Meals/Packets' :
                                            logForm.updateType === 'medical' ? 'Patients Treated' : 'Shelters Built'}
                                    </label>
                                    <input
                                        type="number"
                                        className="w-full border rounded p-2"
                                        value={logForm.metricValue}
                                        onChange={(e) => setLogForm({ ...logForm, metricValue: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <textarea
                                    className="w-full border rounded p-2"
                                    rows="3"
                                    placeholder="Describe the activity..."
                                    value={logForm.description}
                                    onChange={(e) => setLogForm({ ...logForm, description: e.target.value })}
                                />
                            </div>

                            <button
                                onClick={handleLogSubmit}
                                disabled={!logForm.description}
                                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                Submit Update
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
