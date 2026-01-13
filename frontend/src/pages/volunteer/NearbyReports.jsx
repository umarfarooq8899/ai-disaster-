import React, { useEffect, useState } from "react";
import axiosInstance from "../../api/axios";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function VolunteerNearby() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    async function fetchAlerts() {
      try {
        const res = await axiosInstance.get("/alerts/nearby");
        setAlerts(res.data);
      } catch (err) {
        console.error(err);
      }
    }
    fetchAlerts();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Nearby Alerts</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Map */}
        <div className="md:col-span-2 h-96 rounded-xl shadow overflow-hidden">
          <MapContainer
            center={[24.8607, 67.0011]} // Example default center
            zoom={12}
            className="w-full h-full"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            />
            {alerts.map(alert => (
              <Marker
                key={alert._id}
                position={[alert.lat, alert.lng]} // alert must have lat/lng
              >
                <Popup>
                  <h3 className="font-bold">{alert.title}</h3>
                  <p>{alert.description}</p>
                  <p className="text-xs text-gray-500">Severity: {alert.severity}</p>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Alert List */}
        <div className="flex flex-col gap-4">
          {alerts.length === 0 ? (
            <p>No nearby alerts at this time.</p>
          ) : (
            alerts.map(alert => (
              <div
                key={alert._id}
                className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition"
              >
                <h3 className="font-semibold text-lg">{alert.title}</h3>
                <p className="text-gray-600 text-sm">{alert.description}</p>
                <p className="text-gray-500 text-xs mt-1">
                  Location: {alert.location}
                </p>
                <p className="text-gray-500 text-xs">
                  Severity: {alert.severity}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
