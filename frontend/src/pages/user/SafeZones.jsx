import React, { useEffect, useState } from 'react';
import MapView from '../../components/map/MapView';
import { getAllDisasters } from '../../api/disasters';
import { ShieldCheck, MapPin, AlertCircle, Info, RefreshCw } from 'lucide-react';

// Predefined safe zones across Pakistan
const SAFE_ZONES = [
  { _id: 'sz1', title: 'Islamabad Safe Zone', latitude: 33.6844, longitude: 73.0479, severity: 'low', description: 'Federal capital - low risk area with strong emergency services.', dangerRadius: 0 },
  { _id: 'sz2', title: 'Lahore Municipal Zone', latitude: 31.5204, longitude: 74.3587, severity: 'low', description: 'Urban commercial area with good infrastructure.', dangerRadius: 0 },
  { _id: 'sz3', title: 'Karachi North Safe Zone', latitude: 24.9056, longitude: 67.0822, severity: 'low', description: 'Northern Karachi residential area, stable.', dangerRadius: 0 },
  { _id: 'sz4', title: 'Multan Cantonment', latitude: 30.1984, longitude: 71.4687, severity: 'low', description: 'Cantonment area with controlled access and minimal hazard.', dangerRadius: 0 },
  { _id: 'sz5', title: 'Peshawar Urban Zone', latitude: 34.0150, longitude: 71.5249, severity: 'low', description: 'City center with hospitals and emergency facilities.', dangerRadius: 0 },
  { _id: 'sz6', title: 'Quetta Civic Center', latitude: 30.1798, longitude: 66.9750, severity: 'low', description: 'Civic administrative area, disaster-prepared.', dangerRadius: 0 },
  { _id: 'sz7', title: 'Faisalabad Industrial Safe Zone', latitude: 31.4504, longitude: 73.1350, severity: 'low', description: 'Industrial zone with built-in emergency response systems.', dangerRadius: 0 },
  { _id: 'sz8', title: 'Rawalpindi Garrison', latitude: 33.5651, longitude: 73.0169, severity: 'low', description: 'Military garrison with highest safety protocols.', dangerRadius: 0 },
];

export default function SafeZones() {
  const [disasters, setDisasters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState(null);

  useEffect(() => {
    getAllDisasters()
      .then(data => setDisasters(data))
      .catch(() => setDisasters([]))
      .finally(() => setLoading(false));
  }, []);

  const activeDisasters = disasters.filter(d => d.status === 'active');
  const highRisk = disasters.filter(d => d.severity === 'high').length;

  return (
    <div className="min-h-screen bg-slate-50 space-y-6">
      {/* HEADER */}
      <header className="bg-white rounded-3xl border shadow-soft p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Safety Network Active</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-green-600" />
              Safe Zones Map
            </h1>
            <p className="text-slate-500 mt-1 text-sm">Verified safety zones and live disaster overlap across Pakistan.</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-green-50 border border-green-100 rounded-2xl px-4 py-3 text-center">
              <p className="text-2xl font-black text-green-700">{SAFE_ZONES.length}</p>
              <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider">Safe Zones</p>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 text-center">
              <p className="text-2xl font-black text-red-700">{activeDisasters.length}</p>
              <p className="text-[10px] text-red-600 font-bold uppercase tracking-wider">Active Hazards</p>
            </div>
            <div className="bg-orange-50 border border-orange-100 rounded-2xl px-4 py-3 text-center">
              <p className="text-2xl font-black text-orange-700">{highRisk}</p>
              <p className="text-[10px] text-orange-600 font-bold uppercase tracking-wider">High Risk</p>
            </div>
          </div>
        </div>
      </header>

      {/* INFO BANNER */}
      <div className="bg-brand-50 border border-brand-100 rounded-2xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-brand-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-bold text-brand-700">How to read this map</p>
          <p className="text-xs text-brand-600 mt-1">
            <strong>Green markers</strong> indicate verified safe zones. <strong>Red/Orange markers</strong> are active disaster locations.
            Use this map to navigate away from disaster zones toward safe areas.
          </p>
        </div>
      </div>

      {/* MAIN MAP */}
      <div className="bg-white rounded-3xl border shadow-soft overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand-600" />
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Pakistan Safety Overview</h2>
          </div>
        </div>
        {loading ? (
          <div className="h-[450px] animate-pulse bg-slate-100 flex items-center justify-center text-slate-400 text-sm">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading safety data...
          </div>
        ) : (
          <div className="h-[450px]">
            <MapView
              disasters={[...SAFE_ZONES, ...activeDisasters]}
              center={[30.3753, 69.3451]}
              defaultZoom={5}
              height="100%"
            />
          </div>
        )}
      </div>

      {/* SAFE ZONES LIST */}
      <div className="bg-white rounded-3xl border shadow-soft p-8">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-green-600" />
          Verified Safe Zones ({SAFE_ZONES.length})
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SAFE_ZONES.map(zone => (
            <div
              key={zone._id}
              onClick={() => setSelectedZone(selectedZone?._id === zone._id ? null : zone)}
              className={`cursor-pointer border rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${selectedZone?._id === zone._id
                  ? 'border-green-400 bg-green-50 shadow-md shadow-green-100'
                  : 'border-green-100 bg-green-50/40 hover:border-green-300'
                }`}
            >
              <div className="flex items-start gap-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 shrink-0" />
                <h3 className="font-bold text-slate-800 text-sm leading-snug">{zone.title}</h3>
              </div>
              <p className="text-[11px] text-slate-500 line-clamp-2 ml-4">{zone.description}</p>
              <div className="mt-3 ml-4 flex items-center gap-1">
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[9px] font-black uppercase tracking-widest rounded-full">SAFE</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ACTIVE DISASTERS WARNING */}
      {activeDisasters.length > 0 && (
        <div className="bg-white rounded-3xl border border-red-100 shadow-soft p-8">
          <h2 className="text-sm font-black text-red-700 uppercase tracking-widest mb-6 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            Active Disaster Zones — Avoid These Areas ({activeDisasters.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeDisasters.map(d => (
              <div key={d._id} className="border border-red-100 rounded-2xl p-4 bg-red-50/40">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-slate-800 text-sm">{d.title}</h3>
                  <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-full text-white shrink-0
                    ${d.severity === 'high' ? 'bg-red-500' : d.severity === 'medium' ? 'bg-orange-500' : 'bg-yellow-500'}`}>
                    {d.severity}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                  <MapPin className="w-3 h-3 text-red-400 shrink-0" />
                  <span className="truncate">{d.location || 'Location unavailable'}</span>
                </div>
                {d.dangerRadius > 0 && (
                  <p className="text-[10px] text-orange-600 font-bold mt-2">⚠ {d.dangerRadius} km danger radius</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
