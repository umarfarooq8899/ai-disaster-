import React, { useEffect, useRef, Component } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  ZoomControl,
  Circle,
  useMapEvents,
  useMap,
} from "react-leaflet";
import useSupercluster from "use-supercluster";
import L from "leaflet";
import "../../utils/leafletConfig";
import { MapPin } from "lucide-react";

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

// ─── Cluster icon ─────────────────────────────────────────────────────────────
const fetchClusterIcon = (clusterId, pointCount) => {
  const size = pointCount < 10 ? 30 : pointCount < 100 ? 40 : 50;
  return L.divIcon({
    html: `<div style="
      background:rgba(239, 68, 68, 0.8);
      width:${size}px;height:${size}px;
      border-radius:50%;
      display:flex;
      align-items:center;
      justify-content:center;
      color:white;
      font-weight:bold;
      border:2px solid white;
      box-shadow:0 0 10px rgba(0,0,0,0.5)">
      ${pointCount}
    </div>`,
    className: "custom-cluster-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

// ─── Map Event Tracker ────────────────────────────────────────────────────────
function MapEventTracker({ setBounds, setZoom }) {
  const map = useMapEvents({
    moveend: () => {
      const b = map.getBounds();
      setBounds([
        b.getWest(),
        b.getSouth(),
        b.getEast(),
        b.getNorth()
      ]);
      setZoom(map.getZoom());
    },
    zoomend: () => {
      setZoom(map.getZoom());
    }
  });

  // Initial bounds set on mount
  useEffect(() => {
    const b = map.getBounds();
    setBounds([
      b.getWest(),
      b.getSouth(),
      b.getEast(),
      b.getNorth()
    ]);
    setZoom(map.getZoom());
  }, [map, setBounds, setZoom]);

  return null;
}

// ─── Cluster Marker (uses useMap for flyTo) ───────────────────────────────────
function ClusterMarker({ latitude, longitude, pointCount, clusterId, supercluster }) {
  const map = useMap();
  return (
    <Marker
      position={[latitude, longitude]}
      icon={fetchClusterIcon(clusterId, pointCount)}
      eventHandlers={{
        click: () => {
          const expansionZoom = Math.min(
            supercluster.getClusterExpansionZoom(clusterId),
            20
          );
          map.flyTo([latitude, longitude], expansionZoom, { duration: 0.8 });
        },
      }}
    />
  );
}

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

  // Supercluster specific state
  const [bounds, setBounds] = React.useState(null);
  const [mapZoom, setMapZoom] = React.useState(initialZoom);

  // Memoize valid points into GeoJSON format for supercluster
  const points = React.useMemo(() => {
    return validDisasters.map(d => ({
      type: "Feature",
      properties: { cluster: false, disasterId: d._id, ...d },
      geometry: { type: "Point", coordinates: [d.longitude, d.latitude] }
    }));
  }, [validDisasters]);

  // Hook handles calculation & returning visible clusters/points
  const { clusters, supercluster } = useSupercluster({
    points,
    bounds,
    zoom: mapZoom,
    options: { radius: 75, maxZoom: 20 }
  });

  return (
    <MapErrorBoundary height={height}>
      <div
        className="relative w-full rounded-2xl overflow-hidden shadow-lg bg-slate-100 flex flex-col"
        style={{ height, minHeight: "250px", zIndex: 1 }}
      >
        <MapContainer
          center={center || [30, 70]}
          zoom={initialZoom}
          scrollWheelZoom
          zoomControl={false}
          className="w-full flex-1"
          style={{ minHeight: "400px" }}  >
          <MapEventTracker setBounds={setBounds} setZoom={setMapZoom} />
          {center && <ChangeView center={center} zoom={initialZoom} />}
          <ZoomControl position="bottomright" />

          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            subdomains={["a", "b", "c"]}
            maxNativeZoom={18}
            maxZoom={19}
            keepBuffer={4}
          />

          {clusters.map((cluster) => {
            const [longitude, latitude] = cluster.geometry.coordinates;
            const { cluster: isCluster, point_count: pointCount, disasterId } = cluster.properties;

            if (isCluster) {
              return (
                <ClusterMarker
                  key={`cluster-${cluster.id}`}
                  latitude={latitude}
                  longitude={longitude}
                  pointCount={pointCount}
                  clusterId={cluster.id}
                  supercluster={supercluster}
                />
              );
            }

            // Not a cluster, so it's a single disaster
            const d = cluster.properties;
            const markerProps = showPin ? {} : { icon: getSeverityIcon(d.severity) };

            return (
              <Marker
                key={d._id || disasterId || `${latitude}-${longitude}`}
                position={[latitude, longitude]}
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
                        {d.description}
                      </p>
                    )}
                    <div className="pt-2 border-t mt-2">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`}
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
