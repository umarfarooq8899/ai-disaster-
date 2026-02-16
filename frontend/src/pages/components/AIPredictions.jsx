import React, { useState, useEffect, useContext } from "react";
import api from "../../api/client";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-hot-toast";
import {
  FaWater,
  FaWind,
  FaTemperatureHigh,
  FaMapMarkerAlt,
  FaExclamationTriangle,
  FaCheckCircle,
  FaSync,
  FaShieldAlt,
  FaFire
} from "react-icons/fa";

export default function AIPredictions() {
  const { user } = useContext(AuthContext);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Poll for updates every 30 seconds
  useEffect(() => {
    fetchPredictions();
    const interval = setInterval(fetchPredictions, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchPredictions = async () => {
    try {
      const res = await api.get("/predictions");
      if (res.data.success) {
        setPredictions(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch predictions", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await api.post("/predictions/generate");
      if (res.data.success) {
        toast.success(`Generated ${res.data.count} new risk analysis reports.`);
        fetchPredictions();
      }
    } catch (error) {
      toast.error("Failed to generate analysis.");
    } finally {
      setGenerating(false);
    }
  };

  const handleAction = async (id, action) => {
    try {
      const res = await api.patch(`/predictions/${id}/action`, {
        status: "Action Taken",
        adminAction: action,
      });
      if (res.data.success) {
        toast.success("Action recorded successfully.");
        fetchPredictions();
      }
    } catch (error) {
      toast.error("Failed to update status.");
    }
  };

  const getRiskIcon = (type) => {
    switch (type) {
      case "flood": return <FaWater className="text-blue-500" />;
      case "fire": return <FaFire className="text-orange-500" />;
      case "earthquake": return <FaExclamationTriangle className="text-yellow-600" />;
      default: return <FaExclamationTriangle className="text-slate-500" />;
    }
  };

  const getRiskColor = (level) => {
    switch (level) {
      case "high": return "bg-red-50 border-red-200 text-red-700";
      case "medium": return "bg-yellow-50 border-yellow-200 text-yellow-700";
      case "low": return "bg-green-50 border-green-200 text-green-700";
      default: return "bg-slate-50 border-slate-200 text-slate-700";
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FaShieldAlt className="text-brand-600" />
            Pakistan Disaster Monitor (AI-Powered)
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Real-time AI analysis of environmental data across Pakistan.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPredictions}
            title="Refresh Data"
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition"
          >
            <FaSync className={loading ? "animate-spin" : ""} />
          </button>

          {(user?.role === "admin" || user?.role === "rescue_coordinator") && (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-lg hover:bg-brand-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              {generating ? "Analyzing..." : "Run AI Analysis"}
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {predictions.length === 0 && !loading ? (
          <div className="col-span-full py-12 text-center text-slate-500">
            <p>No active risk alerts found.</p>
            {user?.role === "admin" && <p className="text-sm">Click "Run AI Analysis" to simulate data.</p>}
          </div>
        ) : (
          predictions.map((pred) => (
            <div key={pred._id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition">
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-full bg-slate-100 text-xl`}>
                      {getRiskIcon(pred.disasterType)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{pred.location}</h3>
                      <p className="text-xs text-slate-500 capitalize">{pred.disasterType} Alert</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${getRiskColor(pred.riskLevel)}`}>
                    {pred.riskLevel} Risk
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-y-2 text-sm text-slate-600 mb-4">
                  <div className="flex items-center gap-2">
                    <FaWater className="text-blue-400" />
                    <span>{pred.rainfall} mm</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaWind className="text-slate-400" />
                    <span>{pred.windSpeed} km/h</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaTemperatureHigh className="text-orange-400" />
                    <span>{pred.temperature}°C</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaMapMarkerAlt className="text-red-400" />
                    <span>{pred.predictedRadius} km rad</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg flex justify-between items-center mb-4">
                  <span className="text-xs font-medium text-slate-500">AI Confidence Score</span>
                  <span className="text-lg font-bold text-slate-800">{pred.riskScore}%</span>
                </div>

                {pred.status === "Action Taken" ? (
                  <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-lg text-green-700 text-xs flex items-center gap-2">
                    <FaCheckCircle />
                    <span>Action Taken: {pred.adminAction}</span>
                  </div>
                ) : (
                  (user?.role === "admin" || user?.role === "rescue_coordinator") && (
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleAction(pred._id, "Rescue Team Dispatched")}
                        className="px-3 py-2 bg-brand-600 text-white text-xs font-semibold rounded-lg hover:bg-brand-700 transition"
                      >
                        Dispatch Team
                      </button>
                      <button
                        onClick={() => handleAction(pred._id, "Alert Broadcasted")}
                        className="px-3 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition"
                      >
                        Broadcast Alert
                      </button>
                    </div>
                  )
                )}
              </div>

              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-400 flex justify-between">
                <span>{new Date(pred.createdAt).toLocaleString()}</span>
                <span className="capitalize">{pred.status}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
