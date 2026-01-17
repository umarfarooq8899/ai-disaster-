import React, { useEffect, useState } from "react";
import { getAllDisasters } from "../../api/disasters";
import {
  FaExclamationTriangle,
  FaMapMarkerAlt,
  FaClipboardList,
  FaImage,
  FaClock,
  FaTimes,
} from "react-icons/fa";

export default function MyReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    getAllDisasters()
      .then((data) => setReports(data))
      .finally(() => setLoading(false));
  }, []);

  /* ---------- Skeleton Loader ---------- */
  if (loading) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">Reports</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse bg-gray-100 p-4 rounded-lg shadow"
            >
              <div className="h-4 bg-gray-300 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-300 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <FaClipboardList className="text-blue-600 text-xl" />
        <h2 className="text-xl font-semibold">Reports</h2>
      </div>

      {/* Empty State */}
      {reports.length === 0 && (
        <div className="bg-blue-50 text-blue-700 p-4 rounded-lg">
          No reports submitted yet.
        </div>
      )}

      {/* Reports List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((r) => (
          <div
            key={r._id || r.id}
            className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col"
          >
            {/* Image Section */}
            <div
              className={`relative h-48 bg-gray-100 overflow-hidden ${r.image ? "cursor-pointer" : ""}`}
              onClick={() => r.image && setSelectedImage(`/${r.image}`)}
            >
              {r.image ? (
                <img
                  src={`/${r.image}`}
                  alt={r.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                  <FaImage className="text-4xl mb-2" />
                  <span className="text-xs">No image provided</span>
                </div>
              )}

              {/* Floating Severity Badge */}
              <div className="absolute top-3 right-3">
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-bold shadow-sm backdrop-blur-md
                    ${r.severity === "high"
                      ? "bg-red-500/90 text-white"
                      : r.severity === "medium"
                        ? "bg-yellow-500/90 text-white"
                        : "bg-green-500/90 text-white"
                    }
                  `}
                >
                  {(r.severity || "low").toUpperCase()}
                </span>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-gray-900 leading-tight">
                  {r.title || "Untitled Report"}
                </h3>
                <span
                  className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border font-bold
                    ${r.status === "resolved"
                      ? "bg-green-50 border-green-200 text-green-700"
                      : r.status === "active"
                        ? "bg-blue-50 border-blue-200 text-blue-700"
                        : r.status === "rejected"
                          ? "bg-red-50 border-red-200 text-red-700"
                          : "bg-yellow-50 border-yellow-200 text-yellow-700"
                    }
                  `}
                >
                  {r.status || "pending"}
                </span>
              </div>

              <p className="text-sm text-gray-600 line-clamp-3 mb-4 flex-1">
                {r.description || "No description provided"}
              </p>

              <div className="space-y-2 mt-auto">
                {/* Location */}
                <div className="flex items-start gap-2 text-xs text-gray-500">
                  <FaMapMarkerAlt className="mt-0.5 text-blue-500 flex-shrink-0" />
                  <span className="line-clamp-2">{r.location || "Unknown location"}</span>
                </div>

                {/* Coordinates */}
                {r.latitude && r.longitude && (
                  <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono pl-5">
                    <span>Lat: {r.latitude.toFixed(4)}</span>
                    <span>Long: {r.longitude.toFixed(4)}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[11px] text-gray-400">
                    <FaClock />
                    {new Date(r.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>

                  <button className="text-[11px] font-bold text-blue-600 hover:text-blue-700 transition">
                    VIEW DETAILS
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-5xl w-full max-h-[90vh] flex items-center justify-center animate-zoomIn"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage}
              alt="Full View"
              className="max-h-[90vh] max-w-full object-contain rounded-lg shadow-2xl"
            />
            <button
              className="absolute -top-12 right-0 md:-right-12 text-white text-2xl hover:text-blue-400 transition-colors p-2"
              onClick={() => setSelectedImage(null)}
            >
              <FaTimes />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
