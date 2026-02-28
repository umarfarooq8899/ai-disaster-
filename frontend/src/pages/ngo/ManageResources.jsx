import React, { useState, useEffect } from "react";
import axios from "../../api/axios";
import { Package, Plus, Edit2, Trash2, Search, X } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const CATEGORIES = ["Food", "Medicine", "Shelter", "Vehicle", "Equipment", "Other"];

export default function ManageResources() {
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const [formData, setFormData] = useState({
        id: null,
        name: "",
        category: "Food",
        quantity: 0,
        description: ""
    });

    const fetchResources = async () => {
        try {
            const res = await axios.get("/ngo/resources");
            setResources(res.data);
        } catch (err) {
            toast.error("Failed to load resources");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResources();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post("/ngo/resources", formData);
            toast.success(formData.id ? "Resource updated" : "Resource added");
            setModalOpen(false);
            fetchResources();
            resetForm();
        } catch (err) {
            toast.error("Failed to save resource");
        }
    };

    const resetForm = () => {
        setFormData({ id: null, name: "", category: "Food", quantity: 0, description: "" });
    };

    const handleEdit = (res) => {
        setFormData({
            id: res._id,
            name: res.name,
            category: res.category,
            quantity: res.quantity,
            description: res.description || ""
        });
        setModalOpen(true);
    };

    const filteredResources = resources.filter(r =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <Toaster />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Resource Inventory</h1>
                    <p className="text-gray-500 text-sm">Manage your NGO's relief supplies and stock levels</p>
                </div>
                <button
                    onClick={() => { resetForm(); setModalOpen(true); }}
                    className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition shadow-sm"
                >
                    <Plus className="w-5 h-5" />
                    Add Resource
                </button>
            </div>

            {/* Toolbar */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6 flex items-center gap-3">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search by name or category..."
                    className="bg-transparent border-none focus:ring-0 text-sm w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Inventory Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {loading ? (
                    [...Array(8)].map((_, i) => (
                        <div key={i} className="bg-white h-40 rounded-2xl border border-gray-100 animate-pulse" />
                    ))
                ) : filteredResources.length === 0 ? (
                    <div className="col-span-full py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-gray-400">
                        <Package className="w-12 h-12 mb-4 opacity-20" />
                        <p className="font-medium">Inventory is empty</p>
                        <p className="text-xs">Add resources to start managing your supplies.</p>
                    </div>
                ) : (
                    filteredResources.map(res => (
                        <div key={res._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group">
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-2.5 rounded-xl ${res.category === "Food" ? "bg-orange-50 text-orange-600" :
                                        res.category === "Medicine" ? "bg-rose-50 text-rose-600" :
                                            res.category === "Vehicle" ? "bg-brand-50 text-brand-600" :
                                                "bg-slate-50 text-slate-600"
                                        }`}>
                                        <Package className="w-5 h-5" />
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleEdit(res)}
                                            className="p-1.5 rounded-lg bg-gray-50 text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="font-bold text-gray-800 mb-1 truncate">{res.name}</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">{res.category}</p>

                                <div className="flex items-end justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">In Stock</span>
                                        <span className={`text-2xl font-black ${res.quantity < 10 ? 'text-rose-600' : 'text-slate-800'}`}>
                                            {res.quantity}
                                        </span>
                                    </div>
                                    <div className="h-10 w-24 bg-slate-50 rounded-lg overflow-hidden relative border border-slate-100">
                                        <div
                                            className={`absolute bottom-0 left-0 w-full transition-all duration-1000 ${res.quantity < 10 ? 'bg-rose-500' : 'bg-emerald-500'
                                                }`}
                                            style={{ height: `${Math.min((res.quantity / 100) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {res.description && (
                                <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-50">
                                    <p className="text-[10px] text-gray-500 italic line-clamp-1">{res.description}</p>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-800">
                                {formData.id ? "Edit Resource" : "Add New Resource"}
                            </h2>
                            <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Resource Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                                    <select
                                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Quantity</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                        value={formData.quantity}
                                        onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Description (Optional)</label>
                                <textarea
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                                    rows="3"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                ></textarea>
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-brand-600 text-white font-bold py-3 rounded-lg hover:bg-brand-700 transition"
                            >
                                {formData.id ? "Save Changes" : "Create Resource"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
