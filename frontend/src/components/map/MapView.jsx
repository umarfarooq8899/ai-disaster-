import React, { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  ZoomControl,
  useMap,
} from "react-leaflet";
import { MapPin, Navigation } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon issue using CDN (more reliable for modals/different contexts)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Helper to get severity circle icon
const getSeverityIcon = (severity) => {
  const color =
    severity === "high"
      ? "#EF4444" // red-500
      : severity === "medium"
        ? "#F97316" // orange-500
        : "#10B981"; // green-500

  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      background:${color};
      width:14px;
      height:14px;
      border-radius:50%;
      border:2px solid white;
      box-shadow: 0 0 5px rgba(0,0,0,0.3)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
};

// Helper to change map view
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || map.getZoom());
    }
  }, [center, zoom, map]);
  return null;
}

export default function MapView({ disasters = [], showPin = false, center = null, userLocation = null }) {
  // 🔒 HARD SAFETY
  const safeDisasters = Array.isArray(disasters) ? disasters : [];

  const validDisasters = safeDisasters.filter(
    (d) =>
      d &&
      typeof d.latitude === "number" &&
      typeof d.longitude === "number"
  );

  return (
    <div className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-lg">
      <MapContainer
        center={center || [30, 70]}
        zoom={center ? 12 : 5}
        scrollWheelZoom
        zoomControl={false}
        className="h-full w-full"
      >
        {center && <ChangeView center={center} zoom={12} />}
        <ZoomControl position="bottomright" />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {validDisasters.map((d) => {
          const markerProps = showPin ? {} : { icon: getSeverityIcon(d.severity) };

          return (
            <Marker
              key={d._id || `${d.latitude}-${d.longitude}`}
              position={[d.latitude, d.longitude]}
              {...markerProps}
            >
              <Popup>
                <div className="space-y-1 text-sm min-w-[150px]">
                  <h3 className="font-semibold text-base capitalize">
                    {d.title || d.type || "Disaster"}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 font-medium">Severity:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase 
                      ${d.severity === 'high' ? 'bg-red-100 text-red-700' :
                        d.severity === 'medium' ? 'bg-orange-100 text-orange-700' :
                          'bg-green-100 text-green-700'}`}>
                      {d.severity || "Low"}
                    </span>
                  </div>
                  {d.description && (
                    <p className="text-gray-600 text-xs italic mt-2 line-clamp-3">
                      "{d.description}"
                    </p>
                  )}
                  <div className="pt-2 border-t mt-2">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${d.latitude},${d.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-600 hover:text-brand-800 text-xs font-semibold flex items-center gap-1 no-underline"
                    >
                      <MapPin className="w-3 h-3" /> Open in Google Maps
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {userLocation && (
          <Marker
            position={[userLocation.latitude, userLocation.longitude]}
            icon={L.divIcon({
              className: "user-marker",
              html: `<div style="
                background: #3B82F6;
                width: 18px;
                height: 18px;
                border: 3px solid white;
                border-radius: 50%;
                box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
              ">
                <div style="width: 6px; height: 6px; background: white; border-radius: 50%;"></div>
              </div>`,
              iconSize: [18, 18],
              iconAnchor: [9, 9],
            })}
          >
            <Popup>
              <div className="text-center font-semibold text-brand-600">
                You are here
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-xl px-3 py-2 text-xs shadow">
        <p className="font-semibold mb-1">Severity</p>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500"></span> Low
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-yellow-500"></span> Medium
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500"></span> High
        </div>
      </div>
    </div>
  );
}

