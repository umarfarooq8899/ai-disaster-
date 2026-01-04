import { useEffect, useState } from "react";
import axios from "axios";

const AdminDashboard = () => {
  const [disasters, setDisasters] = useState([]);

  const token = localStorage.getItem("token");

  const fetchDisasters = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/disasters/all",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setDisasters(res.data);
    } catch (error) {
      console.error("Failed to load disasters");
    }
  };

  const updateStatus = async (id, action) => {
    try {
      await axios.put(
        `http://localhost:5000/api/disasters/${action}/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      fetchDisasters();
    } catch (error) {
      console.error("Action failed");
    }
  };

  useEffect(() => {
    fetchDisasters();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Admin Dashboard</h2>

      <table border="1" cellPadding="8" width="100%">
        <thead>
          <tr>
            <th>Type</th>
            <th>Description</th>
            <th>Severity</th>
            <th>Status</th>
            <th>Reported By</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {disasters.map((d) => (
            <tr key={d._id}>
              <td>{d.type}</td>
              <td>{d.description}</td>
              <td>{d.severity}</td>
              <td>{d.status}</td>
              <td>{d.reportedBy?.name}</td>
              <td>
                {d.status === "pending" && (
                  <>
                    <button
                      onClick={() =>
                        updateStatus(d._id, "approve")
                      }
                    >
                      Approve
                    </button>
                    <button
                      onClick={() =>
                        updateStatus(d._id, "reject")
                      }
                      style={{ marginLeft: "5px" }}
                    >
                      Reject
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminDashboard;
