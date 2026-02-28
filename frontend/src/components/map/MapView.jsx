import React, { useEffect, useRef, Component } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  ZoomControl,
  Circle,
  useMap,
} from "react-leaflet";
import { MapPin } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon issue using CDN
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ─── Error Boundary ───────────────────────────────────────────────────────────
class MapErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error) {
    console.error("MapView crashed:", error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div
          className="flex items-center justify-center rounded-2xl bg-slate-100 text-slate-400 text-sm"
          style={{ height: this.props.height || "400px" }}
        >
          Map failed to load. Please refresh.
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Severity icon ────────────────────────────────────────────────────────────
const getSeverityIcon = (severity) => {
  const color =
    severity === "high"
      ? "#EF4444"
      : severity === "medium"
        ? "#F97316"
        : "#10B981";

  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      background:${color};
      width:14px;height:14px;
      border-radius:50%;
      border:2px solid white;
      box-shadow:0 0 5px rgba(0,0,0,0.3)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
};

// ─── ChangeView ──────────────────────────────────────────────────────────────
function ChangeView({ center, zoom }) {
  const map = useMap();
  const centerArrayKey = JSON.stringify(center);

  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || map.getZoom(), {
        duration: 1.5
      });
    }
  }, [centerArrayKey, zoom, map]);
  return null;
}

// ─── Robust invalidateSize + ResizeObserver ──────────────────────────────────
function MapResizeHandler() {
  const map = useMap();
  useEffect(() => {
    // Retry invalidateSize at increasing intervals to survive CSS transitions
    const delays = [100, 300, 600, 1200];
    const timers = delays.map((ms) =>
      setTimeout(() => map.invalidateSize(false), ms)
    );

    // Also watch container for size changes (tab switches, flex reflows, etc.)
    let observer;
    const container = map.getContainer();
    if (container && window.ResizeObserver) {
      observer = new ResizeObserver(() => {
        map.invalidateSize(false);
      });
      observer.observe(container);
    }

    return () => {
      timers.forEach(clearTimeout);
      if (observer) observer.disconnect();
    };
  }, [map]);
  return null;
}

// ─── Main MapView ─────────────────────────────────────────────────────────────
export default function MapView({
  disasters = [],
  showPin = false,
  showRadius = false,
  center = null,
  userLocation = null,
  height = "400px",
  defaultZoom = null,
}) {
  const safeDisasters = Array.isArray(disasters) ? disasters : [];

  const validDisasters = safeDisasters.filter(
    (d) =>
      d &&
      typeof d.latitude === "number" &&
      typeof d.longitude === "number"
  );

  const initialZoom = defaultZoom || (center ? 14 : 5);

  return (
    <MapErrorBoundary height={height}>
      <div
        className="relative w-full rounded-2xl overflow-hidden shadow-lg bg-slate-100"
        style={{ height, minHeight: "250px", zIndex: 1 }}
      >
        <MapContainer
          center={center || [30, 70]}
          zoom={initialZoom}
          scrollWheelZoom
          zoomControl={false}
          style={{ height: "100%", width: "100%" }}
        >
          <MapResizeHandler />
          {center && <ChangeView center={center} zoom={initialZoom} />}
          <ZoomControl position="bottomright" />

          <TileLayer
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            subdomains={["a", "b", "c", "d"]}
            maxNativeZoom={19}
            maxZoom={20}
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
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase 
                        ${d.severity === "high"
                            ? "bg-red-100 text-red-700"
                            : d.severity === "medium"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-green-100 text-green-700"
                          }`}
                      >
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

          {/* Danger Radius overlay */}
          {showRadius &&
            validDisasters.map((d) => {
              if (!d.dangerRadius) return null;
              return (
                <Circle
                  key={`radius-${d._id || `${d.latitude}-${d.longitude}`}`}
                  center={[d.latitude, d.longitude]}
                  pathOptions={{
                    color: "red",
                    fillColor: "#ef4444",
                    fillOpacity: 0.15,
                    weight: 1,
                    dashArray: "5, 5",
                  }}
                  radius={d.dangerRadius * 1000}
                />
              );
            })}

          {userLocation && (
            <Marker
              position={[userLocation.latitude, userLocation.longitude]}
              icon={L.divIcon({
                className: "user-marker",
                html: `<div style="
                  background:#3B82F6;
                  width:18px;height:18px;
                  border:3px solid white;
                  border-radius:50%;
                  box-shadow:0 0 10px rgba(59,130,246,0.5);
                  display:flex;align-items:center;justify-content:center;">
                  <div style="width:6px;height:6px;background:white;border-radius:50%;"></div>
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
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-xl px-3 py-2 text-xs shadow pointer-events-none" style={{ zIndex: 1000 }}>
          <p className="font-semibold mb-1">Severity</p>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> Low
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-400 inline-block" /> Medium
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> High
          </div>
        </div>
      </div>
    </MapErrorBoundary>
  );
}
