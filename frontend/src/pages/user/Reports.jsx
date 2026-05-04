import React, { useEffect, useState } from "react";
import { getMyDisasters } from "../../api/disasters";
import MapView from "../../components/map/MapView";
import {
  ClipboardList,
  MapPin,
  Clock,
  Image as ImageIcon,
  X,
  ChevronRight,
  AlertCircle,
  ShieldCheck,
  AlertTriangle
} from "lucide-react";
import { getFileUrl } from "../../utils/fileUtils";

export default function MyReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    getMyDisasters()
      .then((data) => setReports(data))
      .finally(() => setLoading(false));
  }, []);

  /* ---------- Skeleton Loader ---------- */
  if (loading) {
    return (
      <div className="p-10 max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-10 animate-pulse">
          <div className="w-12 h-12 bg-gray-100 rounded-xl"></div>
          <div className="h-6 bg-gray-100 rounded w-48"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-gray-50 h-72 rounded-3xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 min-h-screen bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-12">
          <div className="p-3 bg-brand-50 rounded-xl">
            <ClipboardList className="text-brand-600 w-6 h-6" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">My Reports</h2>
            <p className="text-sm text-gray-500 font-medium">Manage and track your submitted incident reports.</p>
          </div>
        </div>

        {/* Empty State */}
        {reports.length === 0 && (
          <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
            <p className="text-gray-500 font-medium">No reports found.</p>
          </div>
        )}

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((r) => (
            <div
              key={r._id || r.id}
              className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden group"
            >
              <div
                className="relative aspect-video bg-gray-50 overflow-hidden cursor-pointer"
                onClick={() => setSelectedReport(r)}
              >
                {r.video ? (
                  <video
                    src={getFileUrl(r.video)}
                    className="w-full h-full object-cover"
                    controls={false}
                    muted
                  />
                ) : r.image ? (
                  <img
                    src={getFileUrl(r.image)}
                    alt={r.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <ImageIcon size={32} />
                  </div>
                )}

                <div className="absolute top-4 left-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-sm
                    ${r.severity === 'high' ? 'bg-red-500' : r.severity === 'medium' ? 'bg-orange-500' : 'bg-brand-500'}`}>
                    {r.severity}
                  </span>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-gray-900 mb-2 truncate">{r.title || "Untitled Report"}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-6 flex-1">{r.description || "No description provided."}</p>

                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                    <Clock size={14} />
                    {new Date(r.createdAt).toLocaleDateString()}
                  </div>
                  <button
                    onClick={() => setSelectedReport(r)}
                    className="text-brand-600 font-bold text-xs uppercase hover:underline"
                  >
                    Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Simplified Clean Modal */}
      {selectedReport && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 md:p-10 transition-all"
          onClick={() => setSelectedReport(null)}
        >
          <div
            className="bg-white rounded-[2rem] max-w-6xl w-full h-full max-h-[85vh] overflow-hidden flex flex-col md:flex-row shadow-2xl animate-fadeIn relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button Top Right */}
            <button
              className="absolute top-6 right-6 z-30 bg-gray-50 hover:bg-gray-100 text-gray-500 p-2 rounded-full transition-all shadow-sm"
              onClick={() => setSelectedReport(null)}
            >
              <X size={20} />
            </button>

            {/* Left Section: Visuals */}
            <div className="w-full md:w-[60%] flex flex-col bg-gray-50 border-r border-gray-100">
              {/* Media Container */}
              <div className="h-1/2 bg-black flex items-center justify-center">
                {selectedReport.video ? (
                  <video
                    src={getFileUrl(selectedReport.video)}
                    className="w-full h-full object-contain"
                    controls
                    autoPlay
                  />
                ) : selectedReport.image ? (
                  <img
                    src={getFileUrl(selectedReport.image)}
                    alt={selectedReport.title}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-gray-600 flex flex-col items-center">
                    <ImageIcon size={48} className="mb-2 opacity-20" />
                    <span className="text-xs font-medium opacity-30 uppercase tracking-widest text-white">No Visuals</span>
                  </div>
                )}
              </div>

              {/* Map Container */}
              <div className="h-1/2 relative border-t border-gray-200">
                <MapView
                  disasters={[selectedReport]}
                  showPin={true}
                  center={selectedReport.latitude ? [selectedReport.latitude, selectedReport.longitude] : null}
                  height="100%"
                />
                <div className="absolute top-4 left-4 z-10 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2 pointer-events-none">
                  <MapPin size={12} className="text-brand-500" />
                  Location
                </div>
              </div>
            </div>

            {/* Right Section: Details */}
            <div className="w-full md:w-[40%] p-10 flex flex-col bg-white overflow-y-auto">
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white
                          ${selectedReport.severity === 'high' ? 'bg-red-500' : selectedReport.severity === 'medium' ? 'bg-orange-500' : 'bg-brand-500'}`}>
                    {selectedReport.severity} Severity
                  </span>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600`}>
                    {selectedReport.status || 'Active'}
                  </span>
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900 leading-tight mb-2">
                  {selectedReport.title || "Incident Report"}
                </h2>
                <p className="text-sm text-gray-400 font-medium">Reported on {new Date(selectedReport.createdAt).toLocaleDateString()}</p>
              </div>

              <div className="space-y-8 flex-1">
                {/* Location Info */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Incident Location</h4>
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <MapPin size={18} className="text-brand-600 mt-1 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-gray-800 leading-snug">{selectedReport.location || "Coordinates Pinpointed"}</p>
                      {selectedReport.latitude && (
                        <p className="text-[10px] text-gray-400 font-mono mt-1">
                          {selectedReport.latitude.toFixed(6)}, {selectedReport.longitude.toFixed(6)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Description</h4>
                  <p className="text-gray-600 text-base leading-relaxed bg-brand-50/20 p-5 rounded-2xl border border-brand-50">
                    {selectedReport.description || "No further details provided for this entry."}
                  </p>
                </div>

                {/* Status Indicator */}
                <div className="flex items-center gap-4 py-4 px-5 bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
                  <div className={`p-3 rounded-xl ${selectedReport.status === 'resolved' ? 'bg-green-100 text-green-600' : 'bg-brand-100 text-brand-600'}`}>
                    {selectedReport.status === 'resolved' ? <ShieldCheck size={20} /> : <AlertCircle size={20} />}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Application Status</p>
                    <p className="text-sm font-bold text-gray-800 uppercase tracking-widest leading-none">
                      {selectedReport.status || 'Processing'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-gray-100">
                <button
                  onClick={() => setSelectedReport(null)}
                  className="w-full bg-brand-600 text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-brand-700 transition-all shadow-md active:scale-[0.98]"
                >
                  Ok, Understood
                </button>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
