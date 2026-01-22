import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import axios from "../../api/axios"; // Use axios instance
import { MapPin, CheckCircle, AlertCircle, Send, Calculator, Image as ImageIcon, X } from "lucide-react";
import toast from "react-hot-toast";

export default function Missions() {
  const { user, token } = useContext(AuthContext);
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Status Log Modal State
  const [selectedMission, setSelectedMission] = useState(null);
  const [logForm, setLogForm] = useState({
    updateType: "rescued",
    description: "",
    metricValue: 0,
    imageUrl: ""
  });

  // Volunteer Assignment State
  const [assignModal, setAssignModal] = useState(null);
  const [volunteers, setVolunteers] = useState([]);
  const [selectedVolunteers, setSelectedVolunteers] = useState([]);

  const fetchMissions = async () => {
    try {
      const res = await axios.get("/rescue/missions");
      setMissions(res.data);
    } catch (err) {
      console.error("Failed to fetch missions", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVolunteers = async () => {
    try {
      const res = await axios.get("/rescue/volunteer-management");
      setVolunteers(res.data);
    } catch (err) {
      console.error("Failed to fetch volunteers", err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchMissions();
      fetchVolunteers();
    }
  }, [token]);

  const handleAssignVolunteers = async () => {
    try {
      await axios.post(`/rescue/missions/${assignModal._id}/assign-volunteers`, {
        volunteerIds: selectedVolunteers
      });
      toast.success("Volunteers assigned successfully");
      setAssignModal(null);
      setSelectedVolunteers([]);
      fetchMissions();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to assign volunteers");
    }
  };

  const handleMarkComplete = async (missionId) => {
    try {
      await axios.patch(`/rescue/missions/${missionId}/status`, {
        status: "completed"
      });
      toast.success("Mission marked as complete");
      fetchMissions();
    } catch (err) {
      toast.error("Failed to update mission status");
    }
  };

  const handleLogSubmit = async () => {
    try {
      const payload = {
        missionId: selectedMission._id,
        updateType: logForm.updateType,
        description: logForm.description,
        metrics: logForm.metricValue > 0 ? { count: logForm.metricValue } : {},
        images: logForm.imageUrl ? [logForm.imageUrl] : []
      };

      await axios.post("/rescue/updates", payload);
      toast.success("Status update posted successfully");
      setSelectedMission(null);
      setLogForm({ updateType: "rescued", description: "", metricValue: 0, imageUrl: "" });
    } catch (err) {
      toast.error("Failed to post update");
    }
  };

  if (loading)
    return (
      <div className="p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse h-40"
          />
        ))}
      </div>
    );

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Missions</h1>

      {missions.length === 0 ? (
        <p className="text-gray-600">No missions found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {missions.map((mission) => (
            <div
              key={mission._id}
              className="relative bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col justify-between"
            >
              {/* Status Indicator */}
              <div
                className={`absolute top-4 right-4 px-2 py-1 rounded text-xs font-semibold ${mission.status === "ongoing"
                  ? "bg-green-100 text-green-700"
                  : mission.status === "completed"
                    ? "bg-blue-100 text-blue-700"
                    : mission.status === "pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }`}
              >
                {mission.status}
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-800 capitalize">
                  {mission.title}
                </h2>
                <div className="mt-2 flex items-center gap-2 text-gray-500 text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>{mission.location}</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">{mission.description}</p>

                {mission.assignedVolunteers && mission.assignedVolunteers.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    {mission.assignedVolunteers.length} volunteer(s) assigned
                  </p>
                )}
              </div>

              <div className="mt-4 pt-4 border-t space-y-2">
                {mission.status === "pending" && (
                  <button
                    onClick={() => {
                      setAssignModal(mission);
                      setSelectedVolunteers(mission.assignedVolunteers || []);
                    }}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    Assign Volunteers
                  </button>
                )}

                {mission.status === "ongoing" && (
                  <button
                    onClick={() => handleMarkComplete(mission._id)}
                    className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" /> Mark Complete
                  </button>
                )}

                <button
                  onClick={() => setSelectedMission(mission)}
                  className="w-full bg-slate-900 text-white py-2 rounded-lg hover:bg-slate-800 transition flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" /> Update Status
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* STATUS UPDATE MODAL */}
      {selectedMission && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setSelectedMission(null)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold mb-4">Update Mission Status</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Update Type</label>
                <select
                  className="w-full border rounded p-2"
                  value={logForm.updateType}
                  onChange={(e) => setLogForm({ ...logForm, updateType: e.target.value })}
                >
                  <option value="rescued">People Rescued</option>
                  <option value="cleared">Area Cleared</option>
                  <option value="logistics">Logistics Update</option>
                  <option value="other">General Update</option>
                </select>
              </div>

              {['rescued', 'cleared'].includes(logForm.updateType) && (
                <div>
                  <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                    <Calculator className="w-4 h-4" />
                    {logForm.updateType === 'rescued' ? 'Count (People)' : 'Area Size (sq meters)'}
                  </label>
                  <input
                    type="number"
                    className="w-full border rounded p-2"
                    value={logForm.metricValue}
                    onChange={(e) => setLogForm({ ...logForm, metricValue: parseInt(e.target.value) || 0 })}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  className="w-full border rounded p-2"
                  rows="3"
                  placeholder="Describe the situation..."
                  value={logForm.description}
                  onChange={(e) => setLogForm({ ...logForm, description: e.target.value })}
                />
              </div>

              <button
                onClick={handleLogSubmit}
                disabled={!logForm.description}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Post Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VOLUNTEER ASSIGNMENT MODAL */}
      {assignModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => {
                setAssignModal(null);
                setSelectedVolunteers([]);
              }}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold mb-4">Assign Volunteers</h2>
            <p className="text-sm text-gray-600 mb-4">Mission: {assignModal.title}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select Volunteers</label>
                <div className="border rounded-lg p-3 max-h-60 overflow-y-auto space-y-2">
                  {volunteers.filter(v => !v.isProfileIncomplete).map((volunteer) => (
                    <label
                      key={volunteer._id}
                      className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedVolunteers.includes(volunteer.user?._id || volunteer._id)}
                        onChange={(e) => {
                          const volunteerId = volunteer.user?._id || volunteer._id;
                          if (e.target.checked) {
                            setSelectedVolunteers([...selectedVolunteers, volunteerId]);
                          } else {
                            setSelectedVolunteers(selectedVolunteers.filter(id => id !== volunteerId));
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">
                        {volunteer.user?.name || volunteer.name || "Unknown"}
                      </span>
                    </label>
                  ))}
                  {volunteers.filter(v => !v.isProfileIncomplete).length === 0 && (
                    <p className="text-sm text-gray-500">No volunteers available</p>
                  )}
                </div>
              </div>

              <button
                onClick={handleAssignVolunteers}
                disabled={selectedVolunteers.length === 0}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Assign {selectedVolunteers.length} Volunteer(s)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
