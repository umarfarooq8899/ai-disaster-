import React, { useState, useEffect } from "react";
import axiosInstance from "../../api/axios";
import { MapPin, CheckCircle, Clock, Send, Calculator, X } from "lucide-react";
import toast from "react-hot-toast";
import MapView from "../../components/map/MapView";

export default function VolunteerTasks() {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMissions();
  }, []);

  // Detailed Update Modal State
  const [selectedMission, setSelectedMission] = useState(null);
  const [logForm, setLogForm] = useState({
    updateType: "rescued",
    description: "",
    metricValue: 0
  });

  const fetchMissions = async () => {
    try {
      const res = await axiosInstance.get("/volunteer/my-missions");
      // Only show ongoing or pending missions in active tasks
      const activeMissions = res.data.filter(m => m.status !== "completed");
      setMissions(activeMissions);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch missions");
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (missionId) => {
    try {
      await axiosInstance.post(`/volunteer/missions/${missionId}/complete`);
      toast.success("Mission marked as complete!");
      fetchMissions();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to complete mission");
    }
  };

  const handleLogSubmit = async () => {
    try {
      const payload = {
        missionId: selectedMission._id,
        updateType: logForm.updateType,
        description: logForm.description,
        metrics: logForm.metricValue > 0 ? { count: logForm.metricValue } : {}
      };

      await axiosInstance.post("/rescue/updates", payload); // Reuse rescue updates endpoint
      toast.success("Status update posted successfully");
      setSelectedMission(null);
      setLogForm({ updateType: "rescued", description: "", metricValue: 0 });
    } catch (err) {
      toast.error("Failed to post update");
    }
  };

  if (loading) {
    return (
      <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-xl p-6 border animate-pulse h-48" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">My Assigned Missions</h1>

      {/* Live Map of Assigned Tasks */}
      {missions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-red-600" />
            Live Task Map
          </h2>
          <MapView
            disasters={missions.map(m => ({ ...m.disaster, _id: m._id }))}
            showPin={true}
          />
        </div>
      )}

      {missions.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border">
          <p className="text-gray-500">No missions assigned yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {missions.map((mission) => (
            <div
              key={mission._id}
              className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition flex flex-col justify-between"
            >
              {/* Status Badge */}
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold text-lg text-gray-800">{mission.title}</h3>
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${mission.status === "completed"
                    ? "bg-green-100 text-green-700"
                    : mission.status === "ongoing"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-yellow-100 text-yellow-700"
                    }`}
                >
                  {mission.status}
                </span>
              </div>

              {/* Mission Details */}
              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600">{mission.description}</p>

                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>{mission.location || mission.disaster?.location}</span>
                </div>

                {mission.disaster && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                    <p className="font-medium text-gray-700">Disaster: {mission.disaster.title}</p>
                    {mission.disaster.severity && (
                      <p className="text-gray-500">Severity: {mission.disaster.severity}</p>
                    )}
                  </div>
                )}

                {mission.organization && (
                  <p className="text-xs text-gray-500">
                    Organization: {mission.organization.name}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-4 border-t space-y-2">
                {mission.status !== "completed" && (
                  <>
                    <button
                      onClick={() => handleComplete(mission._id)}
                      className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Mark as Complete
                    </button>
                    <button
                      onClick={() => setSelectedMission(mission)}
                      className="w-full bg-slate-900 text-white py-2 rounded-lg hover:bg-slate-800 transition flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" /> Update Status
                    </button>
                  </>
                )}

                {mission.status === "completed" && (
                  <div className="flex items-center justify-center gap-2 py-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Completed</span>
                  </div>
                )}
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

            <h2 className="text-xl font-bold mb-4 text-gray-800">Update Mission Progress</h2>
            <p className="text-sm text-gray-500 mb-4 truncate">Mission: {selectedMission.title}</p>

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
    </div>
  );
}
