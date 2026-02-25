import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect, useState, useCallback } from "react";
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

// Robust invalidateSize — retries at 100ms, 400ms, 900ms + ResizeObserver
function MapResizeHandler() {
  const map = useMap();
  useEffect(() => {
    const delays = [100, 400, 900];
    const timers = delays.map((ms) =>
      setTimeout(() => map.invalidateSize(false), ms)
    );
    let observer;
    const container = map.getContainer();
    if (container && window.ResizeObserver) {
      observer = new ResizeObserver(() => map.invalidateSize(false));
      observer.observe(container);
    }
    return () => {
      timers.forEach(clearTimeout);
      if (observer) observer.disconnect();
    };
  }, [map]);
  return null;
}

const DisasterMap = () => {
  const [disasters, setDisasters] = useState([]);

  const fetchDisasters = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/disasters/approved");
      setDisasters(res.data);
    } catch (err) {
      console.error("Failed to load disasters");
    }
  }, []);

  useEffect(() => {
    fetchDisasters();
    const timer = setInterval(fetchDisasters, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [fetchDisasters]);

  return (
    <MapContainer
      center={[33.6844, 73.0479]}
      zoom={6}
      style={{ height: "80vh", width: "100%" }}
    >
      <MapResizeHandler />
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        subdomains={["a", "b", "c"]}
        maxNativeZoom={18}
        maxZoom={19}
        keepBuffer={4}
      />

      {disasters.map((d) => {
        const lat = d.latitude || d.location?.lat;
        const lng = d.longitude || d.location?.lng;
        if (typeof lat !== "number" || typeof lng !== "number") return null;
        return (
          <Marker key={d._id || `${lat}-${lng}`} position={[lat, lng]} icon={getIcon(d.severity)}>
            <Popup>
              <div className="text-sm">
                <strong className="block mb-1 capitalize">{d.title || d.type || "Disaster"}</strong>
                <p>Severity: <span className="font-semibold">{d.severity}</span></p>
                {d.description && (
                  <p className="mt-1 text-gray-600 line-clamp-2">{d.description}</p>
                )}
                <div className="pt-2 border-t mt-2">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
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
