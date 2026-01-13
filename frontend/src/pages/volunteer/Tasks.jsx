import React, { useState, useEffect } from "react";
import axiosInstance from "../../api/axios";

export default function VolunteerTasks() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    async function fetchTasks() {
      try {
        const res = await axiosInstance.get("/volunteer/tasks");
        setTasks(res.data);
      } catch (err) {
        console.error(err);
      }
    }
    fetchTasks();
  }, []);

  const updateStatus = async (taskId, status) => {
    try {
      await axiosInstance.put(`/volunteer/tasks/${taskId}`, { status });
      setTasks(prev =>
        prev.map(task =>
          task._id === taskId ? { ...task, status } : task
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">My Tasks</h2>
      {tasks.length === 0 ? (
        <p>No tasks assigned yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tasks.map(task => (
            <div key={task._id} className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition">
              <h3 className="font-semibold text-lg">{task.title}</h3>
              <p className="text-gray-600 text-sm">{task.description}</p>
              <p className="text-gray-500 text-xs mt-1">Location: {task.location}</p>
              <p className="text-gray-500 text-xs">Status: {task.status}</p>
              <div className="mt-3 flex gap-2">
                {task.status !== "In Progress" && (
                  <button
                    onClick={() => updateStatus(task._id, "In Progress")}
                    className="btn-primary"
                  >
                    Start
                  </button>
                )}
                {task.status !== "Completed" && (
                  <button
                    onClick={() => updateStatus(task._id, "Completed")}
                    className="btn-outline"
                  >
                    Complete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
