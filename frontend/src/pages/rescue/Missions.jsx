import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import axios from "../../api/axios"; // Use axios instance
import { MapPin, CheckCircle, AlertCircle, Send, Calculator, Image as ImageIcon, X, Users, Activity, FileImage } from "lucide-react";
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
  const [recommendedVolunteers, setRecommendedVolunteers] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

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
      setRecommendedVolunteers([]);
      fetchMissions();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to assign volunteers");
    }
  };

  const fetchRecommendations = async (missionId) => {
    setLoadingRecommendations(true);
    setRecommendedVolunteers([]);
    try {
      const res = await axios.get(`/volunteer/recommendations?taskId=${missionId}&type=Mission`);
      setRecommendedVolunteers(res.data);
    } catch (err) {
      console.error("Failed to fetch recommendations", err);
      // Fallback to regular volunteers if it fails
    } finally {
      setLoadingRecommendations(false);
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
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition shadow-md font-medium"
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
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group"
            >
              {/* Card Header */}
              <div className="p-6 border-b border-gray-50 flex justify-between items-start relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:rotate-12 transition-transform duration-500">
                  <Activity className="w-24 h-24" />
                </div>

                <div className="relative z-10 min-w-0">
                  <h3 className="font-bold text-lg text-gray-800 truncate group-hover:text-brand-600 transition-colors uppercase tracking-tight">
                    {mission.title}
                  </h3>
                  <p className="text-xs text-gray-400 font-medium flex items-center gap-1 mt-1 uppercase">
                    <MapPin className="w-3 h-3 text-emerald-500" /> {mission.location}
                  </p>
                </div>
                <span className={`relative z-10 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${mission.status === "completed"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                  : mission.status === "pending"
                    ? "bg-amber-50 text-amber-700 border border-amber-100"
                    : mission.status === "ongoing"
                      ? "bg-brand-50 text-brand-700 border border-brand-100"
                      : "bg-red-50 text-red-700 border border-red-100"
                  }`}>
                  {mission.status}
                </span>
              </div>

              {/* Card Body */}
              <div className="p-6 space-y-6 flex-grow">
                <div>
                  <p className="text-sm text-gray-600 line-clamp-3">{mission.description}</p>
                </div>

                {/* Team Section */}
                <div className="pt-4 border-t border-dashed border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      <Users className="w-3 h-3 text-brand-500" />
                      Rescue Team
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {mission.assignedVolunteers && mission.assignedVolunteers.length > 0 ? (
                      mission.assignedVolunteers.map((v, idx) => (
                        <span key={idx} className="text-[10px] font-bold bg-brand-50 text-brand-600 px-2.5 py-1 rounded-lg border border-brand-100">
                          {v.name || "Unknown"}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] italic text-gray-400">No volunteers assigned</span>
                    )}
                  </div>
                </div>

                {/* Evidence Section */}
                {mission.evidenceUrls && mission.evidenceUrls.length > 0 && (
                  <div className="pt-4 border-t border-dashed border-gray-100">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                      <FileImage className="w-3 h-3 text-blue-500" />
                      Field Evidence
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {mission.evidenceUrls.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block aspect-square rounded-lg overflow-hidden border border-gray-200 hover:opacity-80 transition cursor-pointer">
                          <img src={url} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer / Actions */}
              {mission.status !== "completed" && (
                <div className="p-4 border-t bg-gray-50 flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setAssignModal(mission);
                      setSelectedVolunteers((mission.assignedVolunteers || []).map(v => v._id || v));
                      fetchRecommendations(mission._id);
                    }}
                    className="w-full bg-brand-600 text-white py-2 rounded-lg hover:bg-brand-700 transition flex items-center justify-center gap-2 text-sm font-semibold shadow-sm"
                  >
                    <Users className="w-4 h-4" /> Assign Volunteers
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await axios.patch(`/rescue/missions/${mission._id}/status`, { status: "completed" });
                        toast.success("Mission completed");
                        fetchMissions();
                      } catch (err) {
                        toast.error("Failed to update status");
                      }
                    }}
                    className="w-full bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition flex items-center justify-center gap-2 text-sm font-semibold shadow-sm"
                  >
                    <CheckCircle className="w-4 h-4" /> Mark as Complete
                  </button>
                </div>
              )}
            </div>
          ))}
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
                setRecommendedVolunteers([]);
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
                  {loadingRecommendations ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-600 mx-auto"></div>
                      <p className="text-xs text-gray-500 mt-2">Finding best matches...</p>
                    </div>
                  ) : recommendedVolunteers.length > 0 ? (
                    // Recommended View
                    recommendedVolunteers.map((rec, idx) => {
                      const isTopMatch = idx < 3;
                      return (
                        <label
                          key={rec._id}
                          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedVolunteers.includes(rec.user?._id || rec.user)
                            ? "bg-brand-50 border-brand-200"
                            : "hover:bg-gray-50 border-gray-100"
                            }`}
                        >
                          <div className="mt-0.5">
                            <input
                              type="checkbox"
                              checked={selectedVolunteers.includes(rec.user?._id || rec.user)}
                              onChange={(e) => {
                                const volunteerId = rec.user?._id || rec.user;
                                if (e.target.checked) {
                                  setSelectedVolunteers([...selectedVolunteers, volunteerId]);
                                } else {
                                  setSelectedVolunteers(selectedVolunteers.filter(id => id !== volunteerId));
                                }
                              }}
                              className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <span className="text-sm font-medium text-gray-900 truncate pr-2">
                                {rec.name || "Unknown"}
                              </span>
                              {isTopMatch && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800 shrink-0">
                                  Recommended
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                              {rec.distance !== null && rec.distance !== Infinity && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" /> {rec.distance} km away
                                </span>
                              )}
                              {rec.matchScore > 0 && (
                                <span className="flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3 text-emerald-500" /> {rec.matchScore}% Match
                                </span>
                              )}
                            </div>
                          </div>
                        </label>
                      );
                    })
                  ) : (
                    // Fallback to normal volunteers list if no recommendations
                    volunteers.filter(v => !v.isProfileIncomplete).map((volunteer) => (
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
                    ))
                  )}

                  {!loadingRecommendations && recommendedVolunteers.length === 0 && volunteers.filter(v => !v.isProfileIncomplete).length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No volunteers available</p>
                  )}
                </div>
              </div>

              <button
                onClick={handleAssignVolunteers}
                disabled={selectedVolunteers.length === 0}
                className="w-full bg-brand-600 text-white py-2 rounded-lg hover:bg-brand-700 disabled:opacity-50"
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
