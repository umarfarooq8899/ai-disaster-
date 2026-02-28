import { useState } from "react";
import AssignModal from "./AssignModal";

export default function MissionCard({ mission, token, onUpdated }) {
  const [showAssign, setShowAssign] = useState(false);

  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="font-bold text-lg">{mission.title}</h2>
      <p className="text-gray-500">{mission.location}</p>
      <p className="mt-2">{mission.description}</p>
      <p className="mt-1 text-sm text-gray-400">Status: {mission.status}</p>

      <button
        className="mt-3 btn-primary px-3 py-1.5"
        onClick={() => setShowAssign(true)}
      >
        Assign
      </button>

      {showAssign && (
        <AssignModal
          token={token}
          mission={mission}
          onClose={() => setShowAssign(false)}
          onAssigned={onUpdated}
        />
      )}
    </div>
  );
}
