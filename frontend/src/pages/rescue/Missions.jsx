import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { getMissions } from "../../api/rescueApi";
import { MapPin, CheckCircle, AlertCircle } from "lucide-react";

export default function Missions() {
  const { user } = useContext(AuthContext);
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.token) return;

    const fetchMissions = async () => {
      try {
        const data = await getMissions(user.token);
        setMissions(data);
      } catch (err) {
        console.error("Failed to fetch missions", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMissions();
  }, [user]);

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
              className="relative bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-lg transition-transform transform hover:-translate-y-1"
            >
              {/* Status Indicator */}
              <div
                className={`absolute top-4 right-4 w-3 h-3 rounded-full ${
                  mission.status === "Ongoing"
                    ? "bg-green-500"
                    : mission.status === "Completed"
                    ? "bg-blue-500"
                    : "bg-red-500"
                }`}
              />

              <h2 className="text-lg font-semibold text-gray-800">{mission.title}</h2>
              <div className="mt-2 flex items-center gap-2 text-gray-500 text-sm">
                <MapPin className="w-4 h-4" />
                <span>{mission.location}</span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm">
                {mission.status === "Ongoing" && (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
                {mission.status === "Completed" && (
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                )}
                {mission.status === "Alert" && (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
                <span className="text-gray-700 font-medium">{mission.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
