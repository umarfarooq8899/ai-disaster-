import React, { useEffect, useState, useContext } from "react";
import axios from "../../api/axios";
import { AuthContext } from "../../context/AuthContext";
import { createPortal } from "react-dom";
import toast, { Toaster } from "react-hot-toast";
import { Building2, UserPlus, MapPin, Users } from "lucide-react";

/* ================= MODAL: ADD ORGANIZATION ================= */
function AddOrgModal({ type, onClose, onConfirm }) {
    const [data, setData] = useState({ name: "", location: "" });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!data.name) return toast.error("Name is required");
        onConfirm(data);
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md bg-white p-6 rounded-xl shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-xl font-semibold mb-4 capitalize">
                    Add {type} Organization
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        className="input w-full"
                        placeholder="Organization Name"
                        value={data.name}
                        onChange={(e) => setData({ ...data, name: e.target.value })}
                    />
                    <input
                        className="input w-full"
                        placeholder="Location (City/Region)"
                        value={data.location}
                        onChange={(e) => setData({ ...data, location: e.target.value })}
                    />
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary">
                            Create
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}

/* ================= MODAL: ADD COORDINATOR ================= */
function AddCoordModal({ org, type, onClose, onConfirm }) {
    const [data, setData] = useState({ name: "", email: "", password: "" });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!data.name || !data.email || !data.password)
            return toast.error("All fields required");
        onConfirm(data);
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md bg-white p-6 rounded-xl shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-xl font-semibold mb-2">Add Coordinator</h2>
                <p className="text-sm text-gray-500 mb-4">
                    For <span className="font-semibold">{org.name}</span>
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        className="input w-full"
                        placeholder="Coordinator Name"
                        value={data.name}
                        onChange={(e) => setData({ ...data, name: e.target.value })}
                    />
                    <input
                        type="email"
                        className="input w-full"
                        placeholder="Email Address"
                        value={data.email}
                        onChange={(e) => setData({ ...data, email: e.target.value })}
                    />
                    <input
                        type="password"
                        className="input w-full"
                        placeholder="Password"
                        value={data.password}
                        onChange={(e) => setData({ ...data, password: e.target.value })}
                    />
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary">
                            Create User
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}

/* ================= MAIN COMPONENT ================= */
export default function ManageOrganizations() {
    const { user, token } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState("ngo"); // 'ngo' or 'rescue'
    const [orgs, setOrgs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modals
    const [showAddOrg, setShowAddOrg] = useState(false);
    const [showAddCoord, setShowAddCoord] = useState(null); // stores org object if modal active

    const fetchOrgs = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`/organizations/${activeTab}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setOrgs(res.data);
        } catch (err) {
            toast.error("Failed to load organizations");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchOrgs();
    }, [token, activeTab]);

    const handleCreateOrg = async (data) => {
        try {
            await axios.post(`/organizations/${activeTab}`, data, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success("Organization created!");
            setShowAddOrg(false);
            fetchOrgs();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to create org");
        }
    };

    const handleCreateCoord = async (data) => {
        try {
            await axios.post(
                `/organizations/${activeTab}/${showAddCoord._id}/coordinators`,
                data,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("Coordinator added!");
            setShowAddCoord(null);
            fetchOrgs(); // refresh to see coord count update if we displayed it
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to add coordinator");
        }
    };

    return (
        <div className="p-6">
            <Toaster position="top-right" />

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-semibold text-gray-800">
                        Manage Organizations
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Create organizations and assign coordinators
                    </p>
                </div>
                <button
                    onClick={() => setShowAddOrg(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <Building2 className="w-4 h-4" />
                    Add Organization
                </button>
            </div>

            {/* TABS */}
            <div className="flex items-center gap-4 border-b border-gray-200 mb-6">
                <button
                    onClick={() => setActiveTab("ngo")}
                    className={`pb-3 px-4 text-sm font-medium transition ${activeTab === "ngo"
                        ? "text-blue-600 border-b-2 border-blue-600"
                        : "text-gray-500 hover:text-gray-700"
                        }`}
                >
                    NGOs
                </button>
                <button
                    onClick={() => setActiveTab("rescue")}
                    className={`pb-3 px-4 text-sm font-medium transition ${activeTab === "rescue"
                        ? "text-red-600 border-b-2 border-red-600"
                        : "text-gray-500 hover:text-gray-700"
                        }`}
                >
                    Rescue Organizations
                </button>
            </div>

            {/* CONTENT */}
            {loading ? (
                <div className="text-gray-500">Loading...</div>
            ) : orgs.length === 0 ? (
                <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <p className="text-gray-500">No organizations found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {orgs.map((org) => (
                        <div
                            key={org._id}
                            className="bg-white border p-6 rounded-xl shadow-sm hover:shadow-md transition"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800">
                                        {org.name}
                                    </h3>
                                    {org.location && (
                                        <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                                            <MapPin className="w-3 h-3" />
                                            {org.location}
                                        </div>
                                    )}
                                </div>
                                <div
                                    className={`p-2 rounded-lg ${activeTab === "rescue"
                                        ? "bg-red-50 text-red-600"
                                        : "bg-blue-50 text-blue-600"
                                        }`}
                                >
                                    <Building2 className="w-5 h-5" />
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        Coordinators
                                    </span>
                                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                                        {org.coordinators?.length || 0}
                                    </span>
                                </div>

                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                    {org.coordinators?.length > 0 ? (
                                        org.coordinators.map((c) => (
                                            <div
                                                key={c._id}
                                                className="flex items-center gap-2 text-sm text-gray-700"
                                            >
                                                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                                                    {c.name.charAt(0)}
                                                </div>
                                                <span className="truncate">{c.name}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-400 italic">
                                            No coordinators assigned
                                        </p>
                                    )}
                                </div>

                                <button
                                    onClick={() => setShowAddCoord(org)}
                                    className="mt-4 w-full py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center justify-center gap-2 transition"
                                >
                                    <UserPlus className="w-4 h-4" />
                                    Add Coordinator
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* MODALS */}
            {showAddOrg && (
                <AddOrgModal
                    type={activeTab}
                    onClose={() => setShowAddOrg(false)}
                    onConfirm={handleCreateOrg}
                />
            )}
            {showAddCoord && (
                <AddCoordModal
                    org={showAddCoord}
                    type={activeTab}
                    onClose={() => setShowAddCoord(null)}
                    onConfirm={handleCreateCoord}
                />
            )}
        </div>
    );
}
