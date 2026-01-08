import { useState } from "react";
import { createMission } from "../../api/rescueApi";

export default function MissionForm({ token, onCreated }) {
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("active");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const mission = await createMission(token, { title, location, status });
      setTitle("");
      setLocation("");
      setStatus("active");
      if (onCreated) onCreated(mission);
      alert("Mission created successfully!");
    } catch (err) {
      console.error("Failed to create mission", err);
      alert("Failed to create mission.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen flex justify-center">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md space-y-6"
      >
        <h1 className="text-2xl font-bold text-gray-800">Create Mission</h1>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Title</label>
            <input
              type="text"
              placeholder="Mission title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Location</label>
            <input
              type="text"
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
        >
          {loading ? "Creating..." : "Create Mission"}
        </button>
      </form>
    </div>
  );
}
