import React, { useState, useEffect } from "react";
import axiosInstance from "../../api/axios";
import {
  MapPin, CheckCircle, X, Package, Shield, AlertCircle,
  Loader2, FileImage, ChevronDown, ChevronUp, ZoomIn
} from "lucide-react";
import toast from "react-hot-toast";
import { getFileUrl } from "../../utils/fileUtils";
import MapView from "../../components/map/MapView";

export default function VolunteerTasks() {
  // Tasks states
  const [tasks, setTasks] = useState([]);
  const [completedTasks, setCompleted] = useState([]);
  const [loading, setLoading] = useState(true);

  // Detail modal
  const [selectedTask, setSelectedTask] = useState(null);
  const [evidenceFiles, setEvidence] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Reject flow
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);

  // Lightbox for viewing submitted proof
  const [lightbox, setLightbox] = useState(null); // { url, isVideo }

  // Completed section toggle
  const [showCompleted, setShowCompleted] = useState(false);

  // ─── Fetch ────────────────────────────────────────────────────────────────
  const fetchTasks = async () => {
    try {
      const res = await axiosInstance.get("/volunteer/my-missions");
      setTasks(res.data.filter((t) => t.status !== "completed"));
      setCompleted(res.data.filter((t) => t.status === "completed"));
    } catch {
      toast.error("Failed to fetch assigned tasks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, []);

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const isAidTask = (task) => task?.type === "AidAssignment";
  const taskTypeLabel = (task) => isAidTask(task) ? "Aid Delivery" : "Rescue Mission";
  const taskTypeIcon = (task) =>
    isAidTask(task)
      ? <Package className="w-4 h-4 text-amber-500" />
      : <Shield className="w-4 h-4 text-brand-500" />;

  const closeModal = () => {
    setSelectedTask(null);
    setEvidence([]);
    setShowReject(false);
    setRejectReason("");
  };

  const statusBadge = (status) => {
    const map = {
      completed: "bg-emerald-100 text-emerald-700",
      ongoing: "bg-blue-100 text-blue-700",
      pending: "bg-amber-100 text-amber-700",
      assigned: "bg-blue-100 text-blue-700",
      pending_verification: "bg-brand-100 text-brand-700",
    };
    return map[status] || "bg-gray-100 text-gray-600";
  };

  const statusDisplayLabel = (status) => {
    const labels = {
      completed: "Completed", ongoing: "Ongoing", pending: "Pending",
      assigned: "Ongoing", pending_verification: "Awaiting Review",
    };
    return labels[status] || status;
  };

  // ─── Complete Task (submit proof) ─────────────────────────────────────────
  const handleComplete = async () => {
    if (!selectedTask) return;
    setUploading(true);
    try {
      let evidenceUrls = [];
      if (evidenceFiles.length > 0) {
        const formData = new FormData();
        evidenceFiles.forEach((file) => formData.append("evidence", file));
        const uploadRes = await axiosInstance.post(
          "/volunteer/upload-evidence",
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        evidenceUrls = uploadRes.data.urls;
      }

      await axiosInstance.post(
        `/volunteer/missions/${selectedTask._id}/complete`,
        { evidenceUrls }
      );

      // ── Optimistic update: keep modal open, immediately show submitted state ──
      const updatedTask = {
        ...selectedTask,
        status: "pending_verification",
        evidenceUrls,
      };
      setSelectedTask(updatedTask);
      // Also update the card in the task list so the banner shows on the card too
      setTasks((prev) =>
        prev.map((t) => (t._id === selectedTask._id ? updatedTask : t))
      );
      setEvidence([]);

      toast.success("✅ Proof submitted! Your coordinator can now review it.");
      // Background refetch to sync server state
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit proof.");
    } finally {
      setUploading(false);
    }
  };

  // ─── Reject Task ──────────────────────────────────────────────────────────
  const handleReject = async () => {
    if (!selectedTask) return;
    setRejecting(true);
    try {
      const type = isAidTask(selectedTask) ? "AidAssignment" : "Mission";
      await axiosInstance.post(
        `/volunteer/missions/${selectedTask._id}/reject`,
        { type, reason: rejectReason }
      );
      toast.success("Task rejected. Another volunteer will be auto-assigned.");
      closeModal();
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject task.");
    } finally {
      setRejecting(false);
    }
  };

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl p-6 border animate-pulse h-48" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Assigned Tasks</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Manage your rescue missions and aid delivery assignments.
        </p>
      </div>

      {/* Active Tasks */}
      {tasks.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-dashed border-gray-200">
          <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3 opacity-50" />
          <p className="text-gray-600 font-medium">No active tasks assigned.</p>
          <p className="text-sm text-gray-400 mt-1">
            Check back later — your coordinator will assign tasks soon.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => (
            <div
              key={task._id}
              onClick={() => setSelectedTask(task)}
              className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-lg hover:border-brand-200 transition cursor-pointer flex flex-col justify-between group"
            >
              {/* Type + status row */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-widest">
                  {taskTypeIcon(task)}
                  {taskTypeLabel(task)}
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${statusBadge(task.status)}`}>
                  {statusDisplayLabel(task.status)}
                </span>
              </div>

              <h3 className="font-bold text-base text-gray-800 group-hover:text-brand-600 transition mb-2 leading-snug">
                {task.title}
              </h3>

              {/* Coordinator instructions preview */}
              {task.taskDescription && (
                <div className="mb-2 bg-blue-50 rounded-lg p-2.5 border border-blue-100">
                  <p className="text-xs font-bold text-blue-500 mb-0.5">📋 Instructions</p>
                  <p className="text-xs text-gray-700 line-clamp-2">{task.taskDescription}</p>
                </div>
              )}

              {!task.taskDescription && (
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">{task.description}</p>
              )}

              <div className="flex items-center gap-2 text-gray-400 text-xs mb-3">
                <MapPin className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                <span className="truncate">
                  {task.location || task.disaster?.location || "Location unavailable"}
                </span>
              </div>

              {/* ── Proof submitted banner + thumbnails ── */}
              {task.status === "pending_verification" && (
                <div className="mt-2 bg-brand-50 border border-brand-100 rounded-xl p-3">
                  <p className="text-xs text-brand-600 font-bold mb-2">
                    ⏳ Proof submitted — awaiting coordinator review
                  </p>
                  {task.evidenceUrls?.length > 0 && (
                    <div className="grid grid-cols-3 gap-1.5">
                      {task.evidenceUrls.map((url, i) => {
                        const isVideo = /\.(mp4|mov|avi|webm)$/i.test(url);
                        return isVideo ? (
                          <div key={i}
                            onClick={(e) => { e.stopPropagation(); setLightbox({ url: getFileUrl(url), isVideo: true }); }}
                            className="aspect-square rounded-lg bg-brand-100 border border-brand-200 flex items-center justify-center cursor-pointer hover:bg-brand-200 transition"
                          >
                            <span className="text-[10px] text-brand-700 font-bold text-center">🎥 Video</span>
                          </div>
                        ) : (
                          <div key={i}
                            onClick={(e) => { e.stopPropagation(); setLightbox({ url: getFileUrl(url), isVideo: false }); }}
                            className="aspect-square rounded-lg overflow-hidden border border-brand-200 cursor-pointer hover:opacity-80 transition relative group/thumb"
                          >
                            <img src={getFileUrl(url)} alt={`Proof ${i + 1}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/thumb:opacity-100 transition flex items-center justify-center">
                              <ZoomIn className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {task.disaster && (
                <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">{task.disaster.title}</span>
                  {task.disaster.severity && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${task.disaster.severity === "high" ? "bg-red-100 text-red-600"
                      : task.disaster.severity === "medium" ? "bg-orange-100 text-orange-600"
                        : "bg-green-100 text-green-600"}`}>
                      {task.disaster.severity} severity
                    </span>
                  )}
                </div>
              )}

              <p className="text-brand-500 text-xs font-medium mt-3 text-right">Click to manage →</p>
            </div>
          ))}
        </div>
      )
      }

      {/* Completed History */}
      {
        completedTasks.length > 0 && (
          <div className="mt-10">
            <button
              onClick={() => setShowCompleted((p) => !p)}
              className="flex items-center gap-2 text-gray-600 font-bold text-sm hover:text-gray-800 transition mb-4"
            >
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              Completed Tasks ({completedTasks.length})
              {showCompleted ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showCompleted && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedTasks.slice(0, 9).map((task) => (
                  <div key={task._id} className="bg-white rounded-xl p-5 border border-emerald-100 shadow-sm opacity-75">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-widest">
                        {taskTypeIcon(task)}
                        {taskTypeLabel(task)}
                      </div>
                      <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Completed</span>
                    </div>
                    <h3 className="font-semibold text-gray-700 text-sm leading-snug mb-1">{task.title}</h3>
                    <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{task.location || task.disaster?.location || "N/A"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      }

      {/* ── TASK DETAIL MODAL ─────────────────────────────────────────────── */}
      {
        selectedTask && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col md:flex-row">

              {/* Left: Map */}
              <div className="w-full md:w-1/2 h-64 md:h-auto border-b md:border-b-0 md:border-r bg-gray-100 relative">
                {selectedTask.disaster ? (
                  <>
                    <MapView
                      disasters={[{ ...selectedTask.disaster, _id: selectedTask._id }]}
                      showPin
                      height="100%"
                    />
                    <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur rounded-lg px-3 py-1.5 shadow-sm border flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-red-500" />
                      <span className="text-xs font-semibold">Disaster Location</span>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                    <MapPin className="w-12 h-12 mb-2 opacity-20" />
                    <p className="text-sm">Location data unavailable.</p>
                  </div>
                )}
              </div>

              {/* Right: Content */}
              <div className="w-full md:w-1/2 flex flex-col h-[55vh] md:h-auto">
                <div className="p-6 overflow-y-auto flex-1">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-5">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                        {taskTypeIcon(selectedTask)}
                        {taskTypeLabel(selectedTask)}
                      </div>
                      <h2 className="text-xl font-bold text-gray-900 leading-snug">{selectedTask.title}</h2>
                      <p className="text-sm text-brand-600 font-medium mt-0.5">
                        {selectedTask.organization?.name || "Assigned Task"}
                      </p>
                    </div>
                    <button onClick={closeModal} className="p-1.5 hover:bg-gray-100 rounded-full transition shrink-0">
                      <X className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Coordinator instructions */}
                    {selectedTask.taskDescription && (
                      <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <h3 className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1.5">📋 Coordinator Instructions</h3>
                        <p className="text-gray-800 text-sm leading-relaxed">{selectedTask.taskDescription}</p>
                      </div>
                    )}

                    {/* Task description */}
                    <div>
                      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Task Details</h3>
                      <p className="text-gray-700 text-sm leading-relaxed italic border-l-4 border-brand-200 pl-4">
                        {selectedTask.description}
                      </p>
                    </div>

                    {/* Status + Location grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-gray-50 rounded-xl border">
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Status</h3>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${selectedTask.status === "completed" ? "bg-emerald-500"
                            : selectedTask.status === "pending_verification" ? "bg-brand-500"
                              : selectedTask.status === "ongoing" || selectedTask.status === "assigned" ? "bg-blue-500"
                                : "bg-amber-400"}`}
                          />
                          <span className="font-semibold text-gray-700 text-sm">
                            {statusDisplayLabel(selectedTask.status)}
                          </span>
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-xl border">
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Location</h3>
                        <p className="text-xs font-semibold text-gray-700 truncate">
                          {selectedTask.location || selectedTask.disaster?.location || "N/A"}
                        </p>
                      </div>
                    </div>

                    {/* Disaster context */}
                    {selectedTask.disaster && (
                      <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                        <h3 className="text-xs font-bold text-red-500 uppercase tracking-wider mb-1.5">Disaster Context</h3>
                        <p className="font-bold text-gray-800 text-sm">{selectedTask.disaster.title}</p>
                        {selectedTask.disaster.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{selectedTask.disaster.description}</p>
                        )}
                        {selectedTask.disaster.severity && (
                          <span className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${selectedTask.disaster.severity === "high" ? "bg-red-100 text-red-700"
                            : selectedTask.disaster.severity === "medium" ? "bg-orange-100 text-orange-700"
                              : "bg-green-100 text-green-700"}`}>
                            {selectedTask.disaster.severity} severity
                          </span>
                        )}

                        {selectedTask.disaster.isAI && (
                          <div className="mt-3 pt-3 border-t border-red-200">
                             <h4 className="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                               <Shield className="w-3 h-3" /> AI Analysis
                             </h4>
                             <div className="grid grid-cols-2 gap-2 mb-2">
                                <div className="bg-white/50 p-2 rounded-lg border border-red-100">
                                   <p className="text-[9px] text-gray-500 uppercase font-bold">ML Prob.</p>
                                   <p className="text-sm font-black text-red-700">
                                      {selectedTask.disaster.ml_probability ? (selectedTask.disaster.ml_probability * 100).toFixed(1) + "%" : "N/A"}
                                   </p>
                                </div>
                                <div className="bg-white/50 p-2 rounded-lg border border-red-100">
                                   <p className="text-[9px] text-gray-500 uppercase font-bold">Confidence</p>
                                   <p className="text-sm font-black text-red-700">
                                      {selectedTask.disaster.confidence_score ? selectedTask.disaster.confidence_score.toFixed(1) + "%" : "N/A"}
                                   </p>
                                </div>
                             </div>
                             {selectedTask.disaster.threatZones && selectedTask.disaster.threatZones.length > 0 && (
                                <div className="text-xs text-red-800 bg-white/50 p-2 rounded-lg border border-red-100">
                                   <p className="font-bold text-[9px] uppercase mb-1 text-gray-500">Threat Zones</p>
                                   <ul className="list-disc pl-4 space-y-0.5">
                                      {selectedTask.disaster.threatZones.map((z, i) => (
                                         <li key={i}>{z.title}</li>
                                      ))}
                                   </ul>
                                </div>
                             )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── Submitted proof gallery (pending_verification state) ── */}
                    {selectedTask.status === "pending_verification" && (
                      <div className="bg-brand-50 rounded-xl border border-brand-100 p-4">
                        <h3 className="text-xs font-bold text-brand-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <FileImage className="w-3.5 h-3.5" />
                          Your Submitted Proof
                        </h3>
                        {selectedTask.evidenceUrls?.length > 0 ? (
                          <div className="grid grid-cols-3 gap-2">
                            {selectedTask.evidenceUrls.map((url, i) => {
                              const isVideo = /\.(mp4|mov|avi|webm)$/i.test(url);
                              return isVideo ? (
                                <div key={i} className="rounded-lg overflow-hidden border border-brand-200 bg-black">
                                  <video
                                    src={getFileUrl(url)}
                                    controls
                                    className="w-full aspect-square object-cover"
                                  />
                                </div>
                              ) : (
                                <button
                                  key={i}
                                  onClick={() => setLightbox({ url: getFileUrl(url), isVideo: false })}
                                  className="block rounded-lg overflow-hidden border border-brand-200 hover:opacity-80 transition relative group/thumb aspect-square"
                                >
                                  <img src={getFileUrl(url)} alt={`Proof ${i + 1}`} className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/thumb:opacity-100 transition flex items-center justify-center">
                                    <ZoomIn className="w-5 h-5 text-white" />
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-brand-500">No files attached — task completion without evidence.</p>
                        )}
                      </div>
                    )}

                    {/* Evidence upload (only for actionable tasks) */}
                    {selectedTask.status !== "completed" && selectedTask.status !== "pending_verification" && (
                      <div className="pt-1 border-t border-gray-100">
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <FileImage className="w-3 h-3" />
                          Upload Evidence — Photo or Video (Optional)
                        </h3>
                        <input
                          type="file"
                          multiple
                          accept="image/*,video/*"
                          onChange={(e) => setEvidence(Array.from(e.target.files))}
                          className="text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 transition"
                        />
                        {evidenceFiles.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {evidenceFiles.map((f, i) => (
                              <span key={i} className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded-lg flex items-center gap-1">
                                <FileImage className="w-3 h-3" />
                                {f.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="p-5 bg-gray-50 border-t flex flex-col gap-3">
                  {selectedTask.status === "pending_verification" ? (
                    <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 text-center">
                      <div className="text-2xl mb-1">⏳</div>
                      <p className="text-sm font-bold text-brand-700">Proof Submitted!</p>
                      <p className="text-xs text-brand-500 mt-1">
                        Your evidence has been sent to the coordinator for review.
                        You can see your submitted proof above.
                      </p>
                    </div>
                  ) : selectedTask.status !== "completed" ? (
                    <>
                      {!showReject ? (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              disabled={uploading}
                              onClick={handleComplete}
                              className="bg-emerald-600 text-white py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 disabled:opacity-50 text-sm"
                            >
                              {uploading
                                ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                                : <><CheckCircle className="w-4 h-4" /> Submit Proof</>}
                            </button>
                            <button
                              onClick={() => setShowReject(true)}
                              className="bg-red-50 text-red-600 border border-red-200 py-2.5 rounded-xl font-bold hover:bg-red-100 transition flex items-center justify-center gap-2 text-sm"
                            >
                              <X className="w-4 h-4" /> Reject Task
                            </button>
                          </div>
                          <p className="text-[10px] text-center text-gray-400">
                            Upload photo/video proof above, then press Submit. The coordinator will review and mark complete.
                          </p>
                        </>
                      ) : (
                        <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                          <h4 className="text-sm font-bold text-red-800 mb-1 flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4" /> Reject This Task?
                          </h4>
                          <p className="text-xs text-red-600 mb-3">
                            The task will be removed from your list and automatically reassigned.
                          </p>
                          <textarea
                            placeholder="Optional: reason for rejecting…"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className="w-full border border-red-200 rounded-lg p-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-red-400 resize-none mb-3"
                            rows={2}
                          />
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => { setShowReject(false); setRejectReason(""); }}
                              className="px-4 py-1.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition"
                            >
                              Cancel
                            </button>
                            <button
                              disabled={rejecting}
                              onClick={handleReject}
                              className="px-4 py-1.5 text-sm font-semibold bg-red-600 text-white hover:bg-red-700 rounded-lg transition disabled:opacity-50 flex items-center gap-1.5"
                            >
                              {rejecting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                              {rejecting ? "Rejecting…" : "Confirm Reject"}
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="bg-emerald-100 text-emerald-700 py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm">
                      <CheckCircle className="w-5 h-5" /> Task Successfully Completed
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* ── LIGHTBOX ──────────────────────────────────────────────────────────── */}
      {
        lightbox && (
          <div
            className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightbox(null)}
          >
            <button
              className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition"
              onClick={() => setLightbox(null)}
            >
              <X className="w-6 h-6" />
            </button>
            {lightbox.isVideo ? (
              <video
                src={lightbox.url}
                controls
                autoPlay
                className="max-w-full max-h-[85vh] rounded-xl"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <img
                src={lightbox.url}
                alt="Evidence"
                className="max-w-full max-h-[85vh] rounded-xl object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            )}
            <p className="absolute bottom-4 text-white/50 text-xs">Click anywhere outside to close</p>
          </div>
        )
      }
    </div >
  );
}
