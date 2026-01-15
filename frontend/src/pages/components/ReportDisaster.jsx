import React, { useContext, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { createDisaster } from "../../api/disasters";
import { FaImage } from "react-icons/fa";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import toast, { Toaster } from "react-hot-toast";
import "leaflet/dist/leaflet.css";

/* ================= LEAFLET MARKER FIX ================= */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/* ================= REVERSE GEOCODING ================= */
const getAddressFromCoords = async (lat, lng) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    );
    if (!res.ok) throw new Error("Network response was not ok");
    const data = await res.json();
    return data.display_name || "Unknown location";
  } catch (error) {
    console.warn("Geocoding failed:", error);
    return "Location selected (Address unavailable)";
  }
};

/* ================= MAP CLICK HANDLER ================= */
function LocationPicker({ setLocation, setAddress }) {
  useMapEvents({
    async click(e) {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;

      setLocation({ lat, lng });
      setAddress("Fetching address...");

      // Non-blocking fetch
      getAddressFromCoords(lat, lng).then(addr => setAddress(addr));
    },
  });

  return null;
}

// "Locate Me" Button Component
function LocateControl({ setLocation, setAddress }) {
  const map = useMap();

  const handleLocate = () => {
    map.locate().on("locationfound", function (e) {
      setLocation(e.latlng);
      setAddress("Fetching address...");
      getAddressFromCoords(e.latlng.lat, e.latlng.lng).then(addr => setAddress(addr));
      map.flyTo(e.latlng, map.getZoom());
    });
  };

  return (
    <div className="leaflet-bottom leaflet-left pointer-events-auto">
      <div className="leaflet-control leaflets-bar m-4">
        <button
          onClick={(e) => {
            e.preventDefault(); // prevent form submit
            handleLocate();
          }}
          className="bg-white p-2 rounded shadow hover:bg-gray-50 text-sm font-semibold border text-gray-700"
          type="button"
        >
          📍 Locate Me
        </button>
      </div>
    </div>
  );
}

export default function ReportDisaster() {
  const { user, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  const formRef = useRef(null);
  const [mapHeight, setMapHeight] = useState(395); // default height

  const [form, setForm] = useState({
    title: "",
    description: "",
    severity: "medium",
    image: null,
  });

  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState("");

  const [status, setStatus] = useState({
    loading: false,
    error: "",
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login", {
        state: { message: "Please login to report a disaster." },
      });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!formRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (formRef.current) {
        setMapHeight(formRef.current.offsetHeight);
      }
    });

    resizeObserver.observe(formRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const handleChange = (e) =>
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  const handleFileChange = (e) =>
    setForm((s) => ({ ...s, image: e.target.files[0] }));

  const submit = async (e) => {
    e.preventDefault();

    if (!location) {
      return setStatus({
        loading: false,
        error: "Please select a location on the map",
      });
    }

    setStatus({ loading: true, error: "" });

    try {
      const data = new FormData();
      data.append("title", form.title);
      data.append("description", form.description);
      data.append("severity", form.severity);
      data.append("latitude", location.lat);
      data.append("longitude", location.lng);
      data.append("address", address);
      if (form.image) data.append("image", form.image);

      await createDisaster(data);

      setStatus({ loading: false, error: "" });
      toast.success("Disaster reported successfully!");

      setForm({
        title: "",
        description: "",
        severity: "medium",
        image: null,
      });
      setLocation(null);
      setAddress("");
    } catch (err) {
      setStatus({
        loading: false,
        error: err?.response?.data?.message || "Failed to submit report",
      });
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        Checking authentication...
      </div>
    );

  if (!user) return null;

  return (
    <div className="w-full h-screen flex justify-center items-center p-4">
      <Toaster position="top-right" />

      <div className="bg-white shadow-xl rounded-xl w-full max-w-5xl h-full flex md:flex-row flex-col overflow-hidden">
        {/* LEFT: FORM */}
        <form
          ref={formRef}
          onSubmit={submit}
          className="md:w-1/2 w-full flex flex-col p-6 space-y-4"
        >
          <h1 className="text-2xl md:text-3xl font-extrabold mb-2">
            Report a Disaster
          </h1>

          {status.error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {status.error}
            </div>
          )}

          <input
            type="text"
            name="title"
            placeholder="Disaster title"
            value={form.title}
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-2"
            required
          />

          <textarea
            name="description"
            placeholder="Describe the disaster"
            value={form.description}
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-2 min-h-[120px]"
            required
          />

          <select
            name="severity"
            value={form.severity}
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-2"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

          <label className="flex items-center gap-3 cursor-pointer border rounded-lg px-4 py-2">
            <FaImage />
            {form.image ? form.image.name : "Upload image"}
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleFileChange}
            />
          </label>

          <button
            type="submit"
            disabled={status.loading}
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 mt-4"
          >
            {status.loading ? "Submitting..." : "Submit Report"}
          </button>
        </form>

        {/* RIGHT: MAP */}
        <div className="md:w-1/2 w-full p-4">
          <label className="block font-medium mb-2">Select Location on Map</label>

          <MapContainer
            center={[30.3753, 69.3451]}
            zoom={6}
            className="w-full rounded-lg"
            style={{ height: `${mapHeight}px` }} // map height matches full form
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            <LocationPicker setLocation={setLocation} setAddress={setAddress} />
            <LocateControl setLocation={setLocation} setAddress={setAddress} />
            {location && <Marker position={[location.lat, location.lng]} />}
          </MapContainer>

          {address && (
            <div className="mt-3 rounded-lg border bg-gray-50 px-4 py-2 text-sm text-gray-700">
              <strong>Selected Location:</strong>
              <div>{address}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
