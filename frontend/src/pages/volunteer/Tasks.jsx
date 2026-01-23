import React, { useState, useEffect } from "react";
import axiosInstance from "../../api/axios";
import { MapPin, CheckCircle, Clock } from "lucide-react";
import toast from "react-hot-toast";

export default function VolunteerTasks() {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMissions();
  }, []);

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

              {/* Action Button */}
              {mission.status !== "completed" && (
                <button
                  onClick={() => handleComplete(mission._id)}
                  className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark as Complete
                </button>
              )}

              {mission.status === "completed" && (
                <div className="flex items-center justify-center gap-2 py-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Completed</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
