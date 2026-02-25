import React, { useEffect, useState, useCallback } from "react";
import MapView from "../../components/map/MapView";
import { getAllDisasters } from "../../api/disasters";
import {
  Navigation,
  MapPin,
  AlertTriangle,
  Clock,
  X,
  ChevronRight,
  ImageIcon,
  ShieldCheck,
  AlertCircle
} from "lucide-react";

export default function VolunteerNearby() {
  const [disasters, setDisasters] = useState([]);
  const [mapCenter, setMapCenter] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedDisaster, setSelectedDisaster] = useState(null);

  useEffect(() => {
    fetchDisasters();
    handleLocateMe();
    const timer = setInterval(fetchDisasters, 30_000);
    return () => clearInterval(timer);
  }, []);

  const fetchDisasters = useCallback(async () => {
    try {
      const data = await getAllDisasters();
      setDisasters(data);
    } catch (err) {
      console.error("Error fetching disasters:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
    const R = 6371; // Radius of the earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const sortedDisasters = [...disasters].sort((a, b) => {
    if (!userLocation) return new Date(b.createdAt) - new Date(a.createdAt);
    const distA = calculateDistance(userLocation.latitude, userLocation.longitude, a.latitude, a.longitude);
    const distB = calculateDistance(userLocation.latitude, userLocation.longitude, b.latitude, b.longitude);
    return distA - distB;
  });

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setMapCenter([latitude, longitude]);
        setUserLocation({ latitude, longitude });
        setLocating(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setMapCenter([30, 70]);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="p-6 md:p-10 min-h-screen bg-white">
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Nearby Incidents</h2>
            <p className="text-sm text-gray-500 font-medium">Real-time alerts and disasters in your sector.</p>
          </div>
          <button
            onClick={handleLocateMe}
            disabled={locating}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm active:scale-95 whitespace-nowrap text-sm"
          >
            <Navigation size={16} className={locating ? "animate-pulse" : ""} />
            {locating ? "Locating..." : "Regenerate GPS"}
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Main Map */}
          <div className="xl:col-span-3">
            <div className="bg-gray-50 rounded-[2rem] border border-gray-100 overflow-hidden h-[600px] shadow-inner p-2 shadow-gray-200/50">
              <div className="w-full h-full rounded-[1.8rem] overflow-hidden">
                <MapView
                  disasters={disasters}
                  center={mapCenter}
                  userLocation={userLocation}
                  showPin={true}
                  height="100%"
                />
              </div>
            </div>
          </div>

          {/* Incident List */}
          <div className="xl:col-span-1 flex flex-col gap-6">
            <h3 className="font-bold text-gray-900 text-sm uppercase tracking-widest px-2 flex items-center gap-2">
              <AlertCircle size={16} className="text-blue-600" />
              Live Feed
            </h3>

            <div className="space-y-4 overflow-y-auto max-h-[520px] pr-2 custom-scrollbar">
              {loading ? (
                <div className="flex flex-col gap-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-gray-50 h-32 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : sortedDisasters.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                  <p className="text-gray-400 text-xs font-medium">No signals detected.</p>
                </div>
              ) : (
                sortedDisasters.map((d) => (
                  <div
                    key={d._id}
                    className="group bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col"
                    onClick={() => setSelectedDisaster(d)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-bold text-gray-900 group-hover:text-brand-600 transition truncate text-sm">
                        {d.title || d.type || "Active Report"}
                      </h4>
                      <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${d.severity === 'high' ? 'bg-red-500' : d.severity === 'medium' ? 'bg-orange-500' : 'bg-brand-500'}`} />
                    </div>

                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-4 truncate italic">
                      {d.location || "Location Signal Pending"}
                    </p>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase">
                        <Clock size={12} />
                        {new Date(d.createdAt).toLocaleDateString()}
                      </div>

                      {userLocation && d.latitude && d.longitude && (
                        <div className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                          {calculateDistance(userLocation.latitude, userLocation.longitude, d.latitude, d.longitude).toFixed(1)} km
                        </div>
                      )}

                      <ChevronRight size={14} className="text-gray-300" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Simplified Clean Modal */}
      {selectedDisaster && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 md:p-10 transition-all"
          onClick={() => setSelectedDisaster(null)}
        >
          <div
            className="bg-white rounded-[2rem] max-w-6xl w-full h-full max-h-[85vh] overflow-hidden flex flex-col md:flex-row shadow-2xl animate-fadeIn relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button Top Right */}
            <button
              className="absolute top-6 right-6 z-30 bg-gray-50 hover:bg-gray-100 text-gray-500 p-2 rounded-full transition-all shadow-sm"
              onClick={() => setSelectedDisaster(null)}
            >
              <X size={20} />
            </button>

            {/* Left Section: Visuals */}
            <div className="w-full md:w-[60%] flex flex-col bg-gray-50 border-r border-gray-100">
              {/* Media Container */}
              <div className="h-1/2 bg-black flex items-center justify-center">
                {selectedDisaster.video ? (
                  <video
                    src={`/${selectedDisaster.video}`}
                    className="w-full h-full object-contain"
                    controls
                    autoPlay
                  />
                ) : selectedDisaster.image ? (
                  <img
                    src={`/${selectedDisaster.image}`}
                    alt={selectedDisaster.title}
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
                  disasters={[selectedDisaster]}
                  showPin={true}
                  center={[selectedDisaster.latitude, selectedDisaster.longitude]}
                  height="100%"
                />
                <div className="absolute top-4 left-4 z-10 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2 pointer-events-none">
                  <MapPin size={12} className="text-brand-500" />
                  Live Coordinates
                </div>
              </div>
            </div>

            {/* Right Section: Details */}
            <div className="w-full md:w-[40%] p-10 flex flex-col bg-white overflow-y-auto">
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white
                          ${selectedDisaster.severity === 'high' ? 'bg-red-500' : selectedDisaster.severity === 'medium' ? 'bg-orange-500' : 'bg-brand-500'}`}>
                    {selectedDisaster.severity} Severity
                  </span>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600`}>
                    {selectedDisaster.status || 'Active Surveillance'}
                  </span>
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900 leading-tight mb-2">
                  {selectedDisaster.title || selectedDisaster.type || "Active Incident"}
                </h2>
                <p className="text-sm text-gray-400 font-medium">Reported on {new Date(selectedDisaster.createdAt).toLocaleDateString()}</p>
              </div>

              <div className="space-y-8 flex-1">
                {/* Location Info */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Location</h4>
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <MapPin size={18} className="text-brand-600 mt-1 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-gray-800 leading-snug">{selectedDisaster.location || "Coordinates Pinpointed"}</p>
                      <p className="text-[10px] text-gray-400 font-mono mt-1">
                        {selectedDisaster.latitude.toFixed(6)}, {selectedDisaster.longitude.toFixed(6)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Description</h4>
                  <p className="text-gray-600 text-base leading-relaxed bg-brand-50/20 p-5 rounded-2xl border border-brand-50">
                    {selectedDisaster.description || "Field intelligence report pending full documentation. Initial survey suggests standard monitoring."}
                  </p>
                </div>

                {/* Status Indicator */}
                <div className="flex items-center gap-4 py-4 px-5 bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
                  <div className={`p-3 rounded-xl ${selectedDisaster.status === 'resolved' ? 'bg-green-100 text-green-600' : 'bg-brand-100 text-brand-600'}`}>
                    {selectedDisaster.status === 'resolved' ? <ShieldCheck size={20} /> : <AlertCircle size={20} />}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Current Status</p>
                    <p className="text-sm font-bold text-gray-800 uppercase tracking-widest leading-none">
                      {selectedDisaster.status || 'Active Monitoring'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-gray-100">
                <button
                  onClick={() => setSelectedDisaster(null)}
                  className="w-full bg-brand-600 text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-brand-700 transition-all shadow-md active:scale-[0.98]"
                >
                  Acknowledge
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
