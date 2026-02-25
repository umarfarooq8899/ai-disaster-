import { useEffect, useState } from "react";
import { getVolunteers, getResources, assignMission } from "../../api/rescueApi";

export default function AssignModal({ token, mission, onClose, onAssigned }) {
  const [volunteers, setVolunteers] = useState([]);
  const [resources, setResources] = useState([]);
  const [selectedVolunteers, setSelectedVolunteers] = useState([]);
  const [selectedResources, setSelectedResources] = useState([]);

  useEffect(() => {
    getVolunteers(token).then(setVolunteers).catch(console.error);
    getResources(token).then(setResources).catch(console.error);
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await assignMission(token, mission._id, {
        volunteers: selectedVolunteers,
        resources: selectedResources,
      });
      onAssigned();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to assign volunteers/resources");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded w-96 shadow">
        <h2 className="text-lg font-bold mb-4">Assign Volunteers & Resources</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Volunteers</label>
            <select
              multiple
              className="border p-2 w-full rounded h-24"
              value={selectedVolunteers}
              onChange={(e) =>
                setSelectedVolunteers([...e.target.selectedOptions].map(o => o.value))
              }
            >
              {volunteers.map(v => (
                <option key={v._id} value={v._id}>
                  {v.name} ({v.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1">Resources</label>
            <select
              multiple
              className="border p-2 w-full rounded h-24"
              value={selectedResources}
              onChange={(e) =>
                setSelectedResources([...e.target.selectedOptions].map(o => o.value))
              }
            >
              {resources.map(r => (
                <option key={r._id} value={r._id}>
                  {r.name} - {r.type}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" className="px-4 py-2 rounded bg-gray-300" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded bg-green-500 text-white">
              Assign
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
