import React, { useEffect, useState, useContext } from "react";
import axios from "../../api/axios";
import { AuthContext } from "../../context/AuthContext";
import { CheckCircle, XCircle, Mail, Phone, MapPin } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function ManageNgoVolunteers() {
  const { user } = useContext(AuthContext);
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchVolunteers = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/ngo/volunteers");
      setVolunteers(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load volunteers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVolunteers();
  }, []);

  const filteredVolunteers = volunteers.filter(v =>
    v.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <Toaster />
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manage Volunteers</h1>
          <p className="text-gray-500">Official volunteers for your organization</p>
        </div>
        <div className="relative w-full md:w-64">
          {/* Mock Search Icon Component if Lucide not available or just use text */}
          <input
            type="text"
            placeholder="Search team members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-3 pr-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none shadow-sm text-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white h-48 rounded-2xl border border-gray-100 shadow-sm" />
          ))}
        </div>
      ) : filteredVolunteers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-20 text-center text-gray-400">
          No volunteers matches found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVolunteers.map(v => (
            <div key={v._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md transition duration-200">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="h-12 w-12 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 font-bold text-xl uppercase">
                    {v.user?.name?.charAt(0)}
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${v.available ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-orange-50 text-orange-600 border border-orange-100'
                    }`}>
                    {v.available ? 'Available' : (v.currentTask ? 'On Mission' : 'Busy')}
                  </span>
                </div>

                <h3 className="font-bold text-gray-800 text-lg mb-1 group-hover:text-brand-600 transition truncate">{v.user?.name}</h3>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-tight flex items-center gap-1 mb-4">
                  <Mail className="w-3 h-3" /> {v.user?.email}
                </p>

                <div className="space-y-2 pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4 text-gray-400" /> {v.phone || 'N/A'}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 text-gray-400" /> {v.city || 'N/A'}, {v.province || ''}
                  </div>
                </div>

                {v.skills && v.skills.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {v.skills.slice(0, 3).map(skill => (
                      <span key={skill} className="text-[10px] bg-slate-50 text-slate-500 px-2 py-0.5 rounded border border-slate-100 font-medium">
                        {skill}
                      </span>
                    ))}
                    {v.skills.length > 3 && <span className="text-[10px] text-gray-400">+{v.skills.length - 3}</span>}
                  </div>
                )}
              </div>

              <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-50 flex justify-between items-center group-hover:bg-gray-50 transition">
                <button className="text-xs font-bold text-gray-400 hover:text-brand-600 transition flex items-center gap-1">
                  View History
                </button>
                {v.currentTask && (
                  <span className="text-[10px] text-brand-600 font-bold bg-brand-50 px-2 py-0.5 rounded">
                    Active Task
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
