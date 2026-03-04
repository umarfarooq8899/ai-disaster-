import React, { useContext, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { createDisaster } from "../../api/disasters";
import { FaImage, FaVideo } from "react-icons/fa";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import toast, { Toaster } from "react-hot-toast";
import "../../utils/leafletConfig";

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


/* ================= PERMISSION MODAL ================= */
function LocationPermissionModal({ onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-sm animate-modal" onClick={e => e.stopPropagation()}>
        <div className="text-center mb-4">
          <div className="bg-brand-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 text-brand-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800">Use your location?</h3>
          <p className="text-gray-500 text-sm mt-2">
            We need access to your device's location to pinpoint the disaster accurately on the map.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium"
          >
            Don't Allow
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 rounded-lg bg-brand-600 text-white hover:bg-brand-700 font-medium shadow-sm hover:shadow"
          >
            Allow Access
          </button>
        </div>
      </div>
    </div>
  );
}

// "Locate Me" Button Component
function LocateControl({ setLocation, setAddress, setShowPermissionModal }) {
  const map = useMap();

  // We need to listen to the custom event "triggerLocate" which we'll dispatch from the modal
  useEffect(() => {
    const fallbackToIPLocation = async () => {
      try {
        setAddress("Fetching location via IP...");
        // ipinfo.io is generally more reliable and less blocked by adblockers than ipapi.co
        const res = await fetch("https://ipinfo.io/json");
        const data = await res.json();

        if (data && data.loc) {
          const [latStr, lngStr] = data.loc.split(',');
          const latlng = { lat: parseFloat(latStr), lng: parseFloat(lngStr) };

          setLocation(latlng);
          const addr = await getAddressFromCoords(latlng.lat, latlng.lng);
          setAddress(addr || `${data.city}, ${data.region}, ${data.country}`);
          map.flyTo(latlng, 12);
          toast.success("Location found via IP fallback.");
        } else {
          toast.error("IP fallback missing coordinates data.");
          console.error("IP API Response:", data);
          setAddress("");
        }
      } catch (err) {
        console.error("IP fallback fetch error:", err);
        toast.error("Network or AdBlocker prevented automatic location fetch.");
        setAddress("");
      }
    };

    const handleLocateEvent = () => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const latlng = { lat: position.coords.latitude, lng: position.coords.longitude };
            setLocation(latlng);
            setAddress("Fetching address...");
            getAddressFromCoords(latlng.lat, latlng.lng).then(addr => setAddress(addr));
            map.flyTo(latlng, 14); // Use a standard zoom level like 14
          },
          (error) => {
            console.error("Geolocation error:", error);
            // If it fails or is denied, quietly fall back to IP location
            fallbackToIPLocation();
          },
          { enableHighAccuracy: false, timeout: 15000, maximumAge: 0 }
        );
      } else {
        fallbackToIPLocation();
      }
    };

    window.addEventListener('triggerLocate', handleLocateEvent);
    return () => window.removeEventListener('triggerLocate', handleLocateEvent);
  }, [map, setLocation, setAddress]);

  return (
    <div className="leaflet-bottom leaflet-left pointer-events-auto">
      <div className="leaflet-control leaflets-bar m-4">
        <button
          onClick={(e) => {
            e.preventDefault();
            setShowPermissionModal(true);
          }}
          className="bg-white p-2 rounded shadow hover:bg-gray-50 text-sm font-semibold border text-gray-700 flex items-center gap-2"
          type="button"
        >
          <span>📍</span> Locate Me
        </button>
      </div>
    </div>
  );
}

export default function ReportDisaster() {
  const { user, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  const formRef = useRef(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    severity: "medium",
    image: null,
    video: null,
  });

  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState("");

  const [status, setStatus] = useState({
    loading: false,
    error: "",
  });

  const [showPermissionModal, setShowPermissionModal] = useState(false);

  const handlePermissionConfirm = () => {
    setShowPermissionModal(false);
    // Dispatch custom event to trigger map.locate() inside the map component
    window.dispatchEvent(new Event('triggerLocate'));
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login", {
        state: { message: "Please login to report a disaster." },
      });
    }
  }, [user, loading, navigate]);



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
      if (form.video) data.append("video", form.video);

      await createDisaster(data);

      setStatus({ loading: false, error: "" });
      toast.success("Disaster reported successfully!");

      setForm({
        title: "",
        description: "",
        severity: "medium",
        image: null,
        video: null,
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
            <FaImage className="text-gray-500" />
            <span className="text-gray-600 truncate">{form.image ? form.image.name : "Upload Image"}</span>
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleFileChange}
            />
          </label>

          <label className="flex items-center gap-3 cursor-pointer border rounded-lg px-4 py-2">
            <FaVideo className="text-gray-500" />
            <span className="text-gray-600 truncate">{form.video ? form.video.name : "Upload Video (Optional)"}</span>
            <input
              type="file"
              hidden
              accept="video/*"
              onChange={(e) => setForm(s => ({ ...s, video: e.target.files[0] }))}
            />
          </label>

          <button
            type="submit"
            disabled={status.loading}
            className="w-full bg-brand-600 text-white font-semibold py-3 rounded-lg hover:bg-brand-700 disabled:opacity-50 mt-4"
          >
            {status.loading ? "Submitting..." : "Submit Report"}
          </button>
        </form>

        {/* RIGHT: MAP */}
        <div className="md:w-1/2 w-full p-4">
          <MapContainer
            center={[27.3753, 69.345]}
            zoom={6}
            className="w-full rounded-lg"
            style={{ minHeight: "400px", height: "84%" }}
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              subdomains={["a", "b", "c"]}
              maxNativeZoom={18}
              maxZoom={19}
              keepBuffer={4}
            />

            <LocationPicker setLocation={setLocation} setAddress={setAddress} />
            <LocateControl setLocation={setLocation} setAddress={setAddress} setShowPermissionModal={setShowPermissionModal} />
            {location && <Marker position={[location.lat, location.lng]} />}
          </MapContainer>

          {address && (
            <div className="mt-3 rounded-lg border bg-gray-50 px-4 py-2 text-sm text-gray-700">
              <strong>Selected Location:</strong>
              <div>{address}</div>
            </div>
          )}

          {/* PERMISSION MODAL */}
          {showPermissionModal && (
            <LocationPermissionModal
              onClose={() => setShowPermissionModal(false)}
              onConfirm={handlePermissionConfirm}
            />
          )}
        </div>
      </div>
    </div>
  );
}
