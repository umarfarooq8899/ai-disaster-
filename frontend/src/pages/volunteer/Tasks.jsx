import React, { useState, useEffect } from "react";
import axiosInstance from "../../api/axios";
import { MapPin, CheckCircle, Clock, Send, Calculator, X } from "lucide-react";
import toast from "react-hot-toast";
import MapView from "../../components/map/MapView";

export default function VolunteerTasks() {
  const [missions, setMissions] = useState([]);
  const [completedMissions, setCompletedMissions] = useState([]);
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
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  const fetchMissions = async () => {
    try {
      const res = await axiosInstance.get("/volunteer/my-missions");
      // Separate missions based on status
      const active = res.data.filter(m => m.status !== "completed");
      const completed = res.data.filter(m => m.status === "completed");

      setMissions(active);
      setCompletedMissions(completed);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch missions");
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (missionId) => {
    try {
      setUploading(true);
      let evidenceUrls = [];

      // Upload files first if any
      if (evidenceFiles.length > 0) {
        const formData = new FormData();
        evidenceFiles.forEach(file => {
          formData.append("evidence", file);
        });

        const uploadRes = await axiosInstance.post("/volunteer/upload-evidence", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        evidenceUrls = uploadRes.data.urls;
      }

      await axiosInstance.post(`/volunteer/missions/${missionId}/complete`, { evidenceUrls });
      toast.success("Mission marked as complete!");
      // Update UI without full reload
      setSelectedMission(null);
      setEvidenceFiles([]);
      setShowRejectForm(false);
      setRejectReason("");
      fetchMissions();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to complete mission");
    } finally {
      setUploading(false);
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

  const handleReject = async (missionId) => {
    try {
      setRejecting(true);
      await axiosInstance.post(`/volunteer/missions/${missionId}/reject`, {
        type: selectedMission.type || (selectedMission.organization?.name ? "Mission" : "AidAssignment"), // Use available identifier or generic logic
        reason: rejectReason
      });
      toast.success("Task rejected and re-routed successfully.");
      setSelectedMission(null);
      setShowRejectForm(false);
      setRejectReason("");
      fetchMissions(); // Refetch the list to remove the rejected task
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject task");
    } finally {
      setRejecting(false);
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


      {missions.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border">
          <p className="text-gray-500">No missions assigned yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {missions.map((mission) => (
            <div
              key={mission._id}
              onClick={() => setSelectedMission(mission)}
              className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-lg transition cursor-pointer flex flex-col justify-between group"
            >
              {/* Status Badge */}
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold text-lg text-gray-800 group-hover:text-brand-600 transition">{mission.title}</h3>
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${mission.status === "completed"
                    ? "bg-emerald-100 text-emerald-700"
                    : mission.status === "ongoing"
                      ? "bg-brand-100 text-brand-700"
                      : "bg-yellow-100 text-yellow-700"
                    }`}
                >
                  {mission.status}
                </span>
              </div>

              {/* Mission Details */}
              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600 line-clamp-2">{mission.description}</p>

                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <MapPin className="w-4 h-4 text-brand-500" />
                  <span>{mission.location || mission.disaster?.location}</span>
                </div>

                {mission.disaster && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-xs border border-gray-100">
                    <p className="font-medium text-gray-700">Disaster: {mission.disaster.title}</p>
                    {mission.disaster.severity && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className={`w-2 h-2 rounded-full ${mission.disaster.severity === 'high' ? 'bg-red-500' : mission.disaster.severity === 'medium' ? 'bg-orange-500' : 'bg-green-500'}`}></span>
                        <p className="text-gray-500 capitalize">{mission.disaster.severity} Severity</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Quick Info */}
              <div className="text-xs text-gray-400 mt-auto pt-4 flex items-center justify-between">
                <span>{mission.organization?.name || "Independent"}</span>
                <span className="text-brand-600 font-medium">Click for details →</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* RECENT HISTORY SECTION */}
      {completedMissions.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center gap-2 mb-6">
            <CheckCircle className="w-6 h-6 text-emerald-600" />
            <h2 className="text-xl font-bold text-gray-800">Recent Completion History</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedMissions.slice(0, 6).map((mission) => (
              <div
                key={mission._id}
                className="bg-white rounded-xl p-5 border border-emerald-100 shadow-sm opacity-80"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-gray-800">{mission.title}</h3>
                  <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold">
                    COMPLETED
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-gray-500 text-xs">
                    <MapPin className="w-3 h-3" />
                    <span>{mission.location || mission.disaster?.location}</span>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    {mission.organization?.name || "Independent"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TASK DETAIL MODAL */}
      {selectedMission && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col md:flex-row">
            {/* Left: Map & Media (Desktop) / Top (Mobile) */}
            <div className="w-full md:w-1/2 h-64 md:h-auto border-b md:border-b-0 md:border-r bg-gray-100">
              {selectedMission.disaster ? (
                <div className="h-full relative">
                  <MapView
                    disasters={[{ ...selectedMission.disaster, _id: selectedMission._id }]}
                    showPin={true}
                  />
                  <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur rounded-lg px-3 py-1.5 shadow-sm border flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-600" />
                    <span className="text-xs font-semibold">Location Interface</span>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                  <MapPin className="w-12 h-12 mb-2 opacity-20" />
                  <p>Location data not available for this task</p>
                </div>
              )}
            </div>

            {/* Right: Content */}
            <div className="w-full md:w-1/2 flex flex-col h-[50vh] md:h-auto">
              <div className="p-6 overflow-y-auto flex-1">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedMission.title}</h2>
                    <p className="text-sm text-brand-600 font-medium mt-1">
                      {selectedMission.organization?.name || "Assignment"}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedMission(null);
                      setEvidenceFiles([]);
                      setShowRejectForm(false);
                      setRejectReason("");
                    }}
                    className="p-1 hover:bg-gray-100 rounded-full transition"
                  >
                    <X className="w-6 h-6 text-gray-400" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Description</h3>
                    <p className="text-gray-700 leading-relaxed italic border-l-4 border-brand-200 pl-4">
                      {selectedMission.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-xl border">
                      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Status</h3>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${selectedMission.status === "completed" ? "bg-emerald-500" : "bg-brand-500"}`}></span>
                        <span className="font-semibold text-gray-700 capitalize">{selectedMission.status}</span>
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl border">
                      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Location</h3>
                      <p className="text-xs font-semibold text-gray-700 truncate">{selectedMission.location || selectedMission.disaster?.location || "N/A"}</p>
                    </div>
                  </div>

                  {selectedMission.disaster && (
                    <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                      <h3 className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2">Disaster Context</h3>
                      <p className="font-bold text-gray-800">{selectedMission.disaster.title}</p>
                      <p className="text-xs text-gray-600 mt-1">{selectedMission.disaster.description}</p>
                    </div>
                  )}

                  {/* Evidence Upload Section */}
                  {selectedMission.status !== "completed" && (
                    <div className="pt-4 border-t">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Field Evidence (Optional)</h3>
                      <div className="flex flex-col gap-3">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => setEvidenceFiles(Array.from(e.target.files))}
                          className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
                        />
                        {evidenceFiles.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {evidenceFiles.map((f, i) => (
                              <span key={i} className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded">
                                {f.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-6 bg-gray-50 border-t flex flex-col gap-3">
                {selectedMission.status !== "completed" ? (
                  <>
                    {!showRejectForm ? (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            disabled={uploading}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleComplete(selectedMission._id);
                            }}
                            className="bg-emerald-600 text-white py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 disabled:opacity-50"
                          >
                            <CheckCircle className="w-4 h-4" />
                            {uploading ? "Completing..." : "Complete"}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowRejectForm(true);
                            }}
                            className="bg-red-50 text-red-600 border border-red-200 py-2.5 rounded-xl font-bold hover:bg-red-100 hover:text-red-700 transition flex items-center justify-center gap-2"
                          >
                            <X className="w-4 h-4" /> Reject Task
                          </button>
                        </div>
                        <p className="text-[10px] text-center text-gray-400">
                          Completed tasks move to your history. Rejecting will automatically re-assign to someone else.
                        </p>
                      </>
                    ) : (
                      // Reject Confirmation Form
                      <div className="bg-red-50 border border-red-100 rounded-xl p-4 animate-in fade-in zoom-in duration-200">
                        <h4 className="text-sm font-bold text-red-800 mb-2">Reject Task</h4>
                        <p className="text-xs text-red-600 mb-3">
                          Are you sure? This task will be removed from your list and re-routed to another volunteer automatically.
                        </p>
                        <textarea
                          placeholder="Optional reason (e.g., too far, sick, lack equipment)"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          className="w-full border-red-200 rounded-lg p-2 text-sm bg-white focus:ring-red-500 max-h-24 resize-y mb-3"
                          rows={2}
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setShowRejectForm(false)}
                            className="px-4 py-1.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition"
                          >
                            Cancel
                          </button>
                          <button
                            disabled={rejecting}
                            onClick={() => handleReject(selectedMission._id)}
                            className="px-4 py-1.5 text-sm font-semibold bg-red-600 text-white hover:bg-red-700 shadow-sm rounded-lg transition disabled:opacity-50"
                          >
                            {rejecting ? "Rejecting..." : "Confirm Reject"}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-emerald-100 text-emerald-700 py-3 rounded-xl flex items-center justify-center gap-2 font-bold">
                    <CheckCircle className="w-5 h-5" />
                    Task Successfully Completed
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
