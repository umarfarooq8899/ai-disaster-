import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { useEffect, useState } from "react";
import axios from "axios";

// Marker colors by severity
const getIcon = (severity) => {
  const color =
    severity === "high"
      ? "red"
      : severity === "medium"
        ? "orange"
        : "green";

  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      background:${color};
      width:16px;
      height:16px;
      border-radius:50%;
      border:2px solid white"></div>`,
  });
};

const DisasterMap = () => {
  const [disasters, setDisasters] = useState([]);

  const fetchDisasters = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/disasters/approved"
      );
      setDisasters(res.data);
    } catch (err) {
      console.error("Failed to load disasters");
    }
  };

  useEffect(() => {
    fetchDisasters();
  }, []);

  return (
    <MapContainer
      center={[33.6844, 73.0479]} // Islamabad default
      zoom={6}
      style={{ height: "80vh", width: "100%" }}
    >
      <TileLayer
        attribution="© OpenStreetMap"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {disasters.map((d) => {
        const lat = d.latitude || d.location?.lat;
        const lng = d.longitude || d.location?.lng;

        if (typeof lat !== "number" || typeof lng !== "number") return null;

        return (
          <Marker
            key={d._id || `${lat}-${lng}`}
            position={[lat, lng]}
            icon={getIcon(d.severity)}
          >
            <Popup>
              <div className="text-sm">
                <strong className="block mb-1 capitalize">{d.title || d.type || "Disaster"}</strong>
                <p>Severity: <span className="font-semibold">{d.severity}</span></p>
                {d.description && <p className="mt-1 text-gray-600 line-clamp-2">{d.description}</p>}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default DisasterMap;
