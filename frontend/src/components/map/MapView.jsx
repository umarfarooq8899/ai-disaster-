import React from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  ZoomControl,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon issue
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export default function MapView({ disasters = [] }) {
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
        center={[30, 70]}
        zoom={5}
        scrollWheelZoom
        zoomControl={false}
        className="h-full w-full"
      >
        <ZoomControl position="bottomright" />

        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {validDisasters.map((d) => (
          <Marker
            key={d._id || `${d.latitude}-${d.longitude}`}
            position={[d.latitude, d.longitude]}
          >
            <Popup>
              <div className="space-y-1 text-sm">
                <h3 className="font-semibold text-base">
                  {d.type || "Disaster"}
                </h3>
                <p>
                  <strong>Severity:</strong> {d.severity || "Unknown"}
                </p>
                {d.description && (
                  <p className="text-gray-600">{d.description}</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
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

