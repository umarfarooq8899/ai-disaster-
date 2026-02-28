import React, { useEffect, useState } from "react";
import { getAllDisasters } from "../../api/disasters";
import { MapPin, Clock, AlertCircle, Radio, X } from "lucide-react";

const badge = (severity) => {
  const map = {
    high: "bg-red-500 text-white border-red-200",
    medium: "bg-orange-500 text-white border-orange-200",
    low: "bg-green-500 text-white border-green-200",
  };
  return map[severity] || "bg-slate-500 text-white border-slate-200";
};

export default function Alerts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDisaster, setSelectedDisaster] = useState(null);

  useEffect(() => {
    getAllDisasters(true)
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
            Live Alerts
          </h1>
          <p className="mt-2 text-slate-600">
            Real-time updates on disasters and emergency situations.
          </p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-brand-100 text-sm font-bold text-brand-700">
          {items.length} Active Reports
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 animate-pulse bg-slate-100 rounded-3xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-brand-100 bg-white p-12 text-center">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900">No active alerts</h3>
          <p className="text-slate-500 mt-1">Everything seems to be clear for now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((d) => (
            <div
              key={d._id}
              onClick={() => setSelectedDisaster(d)}
              className="group bg-white rounded-3xl border border-brand-100 overflow-hidden hover:shadow-xl transition-all duration-500 flex flex-col cursor-pointer"
            >
              {/* Content Section */}
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2 gap-4">
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-brand-600 transition-colors capitalize line-clamp-2">
                    {d.title}
                  </h3>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shrink-0 shadow-sm ${badge(d.severity)}`}>
                    {d.severity}
                  </div>
                </div>
                <p className="text-slate-600 text-sm line-clamp-3 mb-6 flex-1 italic">
                  "{d.description}"
                </p>

                <div className="space-y-3 pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-brand-500" />
                    <span className="truncate">{d.location}</span>
                  </div>
                  {d.dangerRadius && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Radio className="w-3.5 h-3.5 text-orange-500" />
                      <span>{d.dangerRadius} km Danger Range</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(d.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedDisaster && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={() => setSelectedDisaster(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-modal"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Content */}
            <div className="relative p-8 overflow-y-auto">
              <button
                onClick={() => setSelectedDisaster(null)}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pr-12">
                <div>
                  <h2 className="text-3xl font-extrabold text-slate-900 capitalize">
                    {selectedDisaster.title}
                  </h2>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                      <MapPin className="w-4 h-4 text-brand-500" />
                      {selectedDisaster.location}
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                      <Clock className="w-4 h-4" />
                      {new Date(selectedDisaster.createdAt).toLocaleString()}
                    </div>
                    {selectedDisaster.dangerRadius && (
                      <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                        <Radio className="w-4 h-4 text-orange-500" />
                        {selectedDisaster.dangerRadius} km Danger Range
                      </div>
                    )}
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-md ${badge(selectedDisaster.severity)}`}>
                  {selectedDisaster.severity} Severity
                </div>
              </div>

              <div className="prose prose-slate max-w-none">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Description</h4>
                <p className="text-slate-700 leading-relaxed text-lg whitespace-pre-wrap">
                  {selectedDisaster.description}
                </p>
              </div>

              {selectedDisaster.reportedBy && (
                <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 font-bold">
                      {selectedDisaster.reportedBy.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-slate-600">Reported by {selectedDisaster.reportedBy.name}</p>
                      <p>{selectedDisaster.reportedBy.email}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

