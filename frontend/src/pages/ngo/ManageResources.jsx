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
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm"
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

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-sm font-semibold text-gray-600">Resource Name</th>
                            <th className="px-6 py-4 text-sm font-semibold text-gray-600">Category</th>
                            <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-center">In Stock</th>
                            <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            <tr><td colSpan="4" className="px-6 py-12 text-center text-gray-400">Loading resources...</td></tr>
                        ) : filteredResources.length === 0 ? (
                            <tr><td colSpan="4" className="px-6 py-12 text-center text-gray-400">No resources found.</td></tr>
                        ) : (
                            filteredResources.map(res => (
                                <tr key={res._id} className="hover:bg-gray-50/50 transition">
                                    <td className="px-6 py-4 font-medium text-gray-800">{res.name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs font-semibold">
                                            {res.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-center font-bold text-gray-700">
                                        {res.quantity}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleEdit(res)}
                                            className="text-gray-400 hover:text-blue-600 transition p-1"
                                        >
                                            <Edit2 className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
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
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                                    <select
                                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
                                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.quantity}
                                        onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Description (Optional)</label>
                                <textarea
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    rows="3"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                ></textarea>
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition"
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
