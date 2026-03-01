import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import useSupercluster from "use-supercluster";
import L from "leaflet";
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";

const POLL_INTERVAL_MS = 30_000;

// Marker colors by severity
const getIcon = (severity) => {
  const color =
    severity === "high" ? "red" : severity === "medium" ? "orange" : "green";
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      background:${color};
      width:16px;height:16px;
      border-radius:50%;
      border:2px solid white;
      box-shadow:0 0 4px rgba(0,0,0,0.25)"></div>`,
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

const DisasterMap = () => {
  const [disasters, setDisasters] = useState([]);

  const fetchDisasters = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/disasters/approved");
      // Only update state if data actually changed to prevent map remounts
      setDisasters(prev => {
        if (JSON.stringify(prev) === JSON.stringify(res.data)) {
          return prev;
        }
        return res.data;
      });
    } catch (err) {
      console.error("Failed to load disasters");
    }
  }, []);

  useEffect(() => {
    fetchDisasters();
    const timer = setInterval(fetchDisasters, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [fetchDisasters]);

  // Supercluster specific state
  const [bounds, setBounds] = useState(null);
  const [mapZoom, setMapZoom] = useState(6);

  // Memoize valid points into GeoJSON format for supercluster
  const points = React.useMemo(() => {
    return disasters
      .filter(d => {
        const lat = d.latitude || d.location?.lat;
        const lng = d.longitude || d.location?.lng;
        return typeof lat === "number" && typeof lng === "number";
      })
      .map(d => {
        const lat = d.latitude || d.location?.lat;
        const lng = d.longitude || d.location?.lng;
        return {
          type: "Feature",
          properties: { cluster: false, disasterId: d._id, ...d },
          geometry: { type: "Point", coordinates: [lng, lat] }
        };
      });
  }, [disasters]);

  // Hook handles calculation & returning visible clusters/points
  const { clusters, supercluster } = useSupercluster({
    points,
    bounds,
    zoom: mapZoom,
    options: { radius: 75, maxZoom: 20 }
  });

  return (
    <MapContainer
      center={[33.6844, 73.0479]}
      zoom={6}
      style={{ minHeight: "60vh", height: "100%", width: "100%" }}
      className="rounded-xl overflow-hidden shadow-lg z-0"
    >
      <MapEventTracker setBounds={setBounds} setZoom={setMapZoom} />
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
            <Marker
              key={`cluster-${cluster.id}`}
              position={[latitude, longitude]}
              icon={fetchClusterIcon(cluster.id, pointCount)}
              eventHandlers={{
                click: () => {
                  const expansionZoom = Math.min(
                    supercluster.getClusterExpansionZoom(cluster.id),
                    20
                  );
                },
              }}
            />
          );
        }

        // Not a cluster, so it's a single disaster
        const d = cluster.properties;

        return (
          <Marker
            key={d._id || disasterId || `${latitude}-${longitude}`}
            position={[latitude, longitude]}
            icon={getIcon(d.severity)}
          >
            <Popup>
              <div className="text-sm">
                <strong className="block mb-1 capitalize">{d.title || d.type || "Disaster"}</strong>
                <p>Severity: <span className="font-semibold">{d.severity}</span></p>
                {d.description && (
                  <p className="mt-1 text-gray-600 line-clamp-2">{d.description}</p>
                )}
                <div className="pt-2 border-t mt-2">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-600 hover:text-brand-800 text-xs font-semibold no-underline"
                  >
                    Open in Google Maps
                  </a>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default DisasterMap;
