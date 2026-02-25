import React, { useState, useEffect } from "react";
import axios from "../../api/axios";
import { Send, Plus, X, Package, Users, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import Select from "react-select";

export default function AssignAid() {
    const navigate = useNavigate();
    const [disasters, setDisasters] = useState([]);
    const [resources, setResources] = useState([]);
    const [volunteers, setVolunteers] = useState([]);
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        disasterId: "",
        items: [], // { resource, quantity }
        volunteerIds: [],
        notes: ""
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [disRes, resRes, volRes] = await Promise.all([
                    axios.get("/disasters"),
                    axios.get("/ngo/resources"),
                    axios.get("/ngo/volunteers")
                ]);

                setDisasters(disRes.data.filter(d => d.status === "active"));
                setResources(resRes.data);
                setVolunteers(volRes.data.map(v => ({
                    value: v.user?._id,
                    label: `${v.user?.name} (${(v.skills || []).join(", ")})`
                })));
            } catch (err) {
                toast.error("Failed to load required data");
            }
        };
        fetchData();
    }, []);

    const handleAddItem = (resId) => {
        if (!resId) return;
        const res = resources.find(r => r._id === resId);
        if (!res) return;

        // Check if already added
        if (form.items.find(i => i.resource === resId)) return;

        setForm({
            ...form,
            items: [...form.items, { resource: resId, name: res.name, max: res.quantity, quantity: 1 }]
        });
    };

    const handleRemoveItem = (idx) => {
        const newItems = [...form.items];
        newItems.splice(idx, 1);
        setForm({ ...form, items: newItems });
    };

    const handleQuantityChange = (idx, val) => {
        const newItems = [...form.items];
        const max = newItems[idx].max;
        let quantity = parseInt(val);
        if (isNaN(quantity)) quantity = 0;
        if (quantity > max) quantity = max;

        newItems[idx].quantity = quantity;
        setForm({ ...form, items: newItems });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.disasterId || form.items.length === 0) {
            return toast.error("Please select a disaster and at least one resource");
        }

        setLoading(true);
        try {
            await axios.post("/ngo/assignments", {
                disasterId: form.disasterId,
                items: form.items.map(i => ({ resource: i.resource, name: i.name, quantity: i.quantity })),
                volunteerIds: form.volunteerIds.map(v => v.value),
                notes: form.notes
            });
            toast.success("Aid assigned successfully!");
            setTimeout(() => navigate("/dashboard/ngo/assignments"), 1500);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to create assignment");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 bg-gray-50 min-h-screen flex justify-center">
            <Toaster />
            <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-6">
                <header>
                    <h1 className="text-2xl font-bold text-gray-800">Assign Relief Aid</h1>
                    <p className="text-gray-500 text-sm">Coordinate resources and volunteers for an active disaster</p>
                </header>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                    {/* Disaster Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Select Active Disaster</label>
                        <select
                            required
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                            value={form.disasterId}
                            onChange={(e) => setForm({ ...form, disasterId: e.target.value })}
                        >
                            <option value="">-- Choose a Disaster --</option>
                            {disasters.map(d => (
                                <option key={d._id} value={d._id}>{d.title} ({d.location})</option>
                            ))}
                        </select>
                    </div>

                    {/* Resource Selection */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="block text-sm font-semibold text-gray-700">Relief Resources</label>
                            <select
                                className="text-sm p-1 border border-gray-300 rounded outline-none"
                                onChange={(e) => { handleAddItem(e.target.value); e.target.value = ""; }}
                                value=""
                            >
                                <option value="">+ Add Resource</option>
                                {resources.filter(r => r.quantity > 0).map(r => (
                                    <option key={r._id} value={r._id}>{r.name} ({r.quantity} in stock)</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            {form.items.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100 animate-in slide-in-from-left-2 transition-all">
                                    <div className="flex-grow font-medium text-gray-800">{item.name}</div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-400">Qty:</span>
                                        <input
                                            type="number"
                                            className="w-20 p-1 border border-gray-300 rounded text-center"
                                            value={item.quantity}
                                            min="1"
                                            onChange={(e) => handleQuantityChange(idx, e.target.value)}
                                        />
                                        <span className="text-xs text-gray-400">/ {item.max}</span>
                                    </div>
                                    <button type="button" onClick={() => handleRemoveItem(idx)} className="text-red-400 hover:text-red-600">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                            {form.items.length === 0 && (
                                <div className="text-center py-6 border-2 border-dashed border-gray-100 rounded-xl text-gray-400 text-sm">
                                    No resources added yet
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Volunteer Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Assign Ground Team (Volunteers)</label>
                        <Select
                            isMulti
                            options={volunteers}
                            value={form.volunteerIds}
                            onChange={(v) => setForm({ ...form, volunteerIds: v })}
                            placeholder="Search and select available volunteers..."
                            className="text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Internal Notes</label>
                        <textarea
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                            rows="3"
                            placeholder="Instructions for the ground team..."
                            value={form.notes}
                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                        ></textarea>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-brand-600 text-white font-bold py-4 rounded-2xl hover:bg-brand-700 transition shadow-lg flex items-center justify-center gap-2"
                >
                    {loading ? "Processing..." : <><Send className="w-5 h-5" /> Confirm Deployment</>}
                </button>
            </form>
        </div>
    );
}
