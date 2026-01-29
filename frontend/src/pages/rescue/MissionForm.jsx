import { useState, useContext } from "react";
import { createMission } from "../../api/rescueApi";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import toast, { Toaster } from "react-hot-toast";

const skillsOptions = [
  { value: "medical", label: "Medical" },
  { value: "technical", label: "Technical" },
  { value: "rescue", label: "Rescue" },
  { value: "logistics", label: "Logistics" },
  { value: "communication", label: "Communication" },
];

export default function MissionForm() {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [skillsRequired, setSkillsRequired] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !location || skillsRequired.length === 0) {
      return toast.error("Please fill all required fields");
    }

    setLoading(true);

    try {
      await createMission(token, {
        title,
        description,
        location,
        skillsRequired: skillsRequired.map(s => s.value)
      });
      toast.success("Mission created successfully!");
      setTimeout(() => navigate("/dashboard/rescue/missions"), 1500);
    } catch (err) {
      console.error("Failed to create mission", err);
      toast.error("Failed to create mission.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen flex justify-center">
      <Toaster />
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-md w-full max-w-lg space-y-6 border border-gray-100"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Create New Mission</h1>
          <p className="text-sm text-gray-500 mt-1">Deploy resources and volunteers to a disaster zone</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Mission Title</label>
            <input
              type="text"
              placeholder="e.g. Flooding Emergency Response"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
            <textarea
              placeholder="Briefly describe the mission objectives..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Location (City, Area)</label>
            <input
              type="text"
              placeholder="e.g. Karachi, Saddar"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Required Skills</label>
            <Select
              isMulti
              options={skillsOptions}
              value={skillsRequired}
              onChange={setSkillsRequired}
              placeholder="Select skills needed..."
              className="react-select-container"
            />
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 transition-all shadow-md active:scale-[0.98]"
          >
            {loading ? "Creating Mission..." : "Publish Mission"}
          </button>
        </div>
      </form>
    </div>
  );
}
