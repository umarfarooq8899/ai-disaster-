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
      // Only show ongoing or pending missions in active dashboard
      const activeMissions = res.data.filter(m => m.status !== "completed");
      setMissions(activeMissions);
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

  const handleAutoAssign = async () => {
    const loadingToast = toast.loading("Auto-assigning volunteers...");
    try {
      const res = await axios.post("/volunteer/admin/auto-assign");
      toast.success(res.data.message, { id: loadingToast });
      fetchMissions();
    } catch (err) {
      toast.error(err.response?.data?.message || "Auto-assignment failed", { id: loadingToast });
    }
  };



  // REMOVED: handleLogSubmit as it's now for volunteers only

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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Missions</h1>
        <button
          onClick={handleAutoAssign}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-800 transition shadow-md"
        >
          <Calculator className="w-5 h-5" />
          Auto Assign
        </button>
      </div>

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

                {/* REMOVED: Mark Complete button is for volunteers only */}
                {/* REMOVED: Update Status button is for volunteers only */}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* REMOVED: STATUS UPDATE MODAL (Now in Volunteer Tasks) */}

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
