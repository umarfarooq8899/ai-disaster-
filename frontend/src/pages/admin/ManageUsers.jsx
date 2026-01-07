// src/pages/admin/ManageUsers.jsx
import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";

export default function ManageUsers() {
  const { user } = useContext(AuthContext);
  const token = user?.token;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get("/api/users", {
        baseURL: "http://localhost:5000/api/users",
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const changeRole = async (id, role) => {
    try {
      await axios.patch(
        `/api/users/${id}/role`,
        { role },
        { baseURL: "http://localhost:5000/api/users", headers: { Authorization: `Bearer ${token}` } }
      );
      fetchUsers();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to change role");
    }
  };

  const changeStatus = async (id, status) => {
    try {
      await axios.patch(
        `/api/users/${id}/status`,
        { status },
        { baseURL: "http://localhost:5000/api/users", headers: { Authorization: `Bearer ${token}` } }
      );
      fetchUsers();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to change status");
    }
  };

  const deleteUser = async (id) => {
    try {
      await axios.delete(`/api/users/${id}`, {
        baseURL: "http://localhost:5000/api/users",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to delete user");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  if (loading) return <div className="p-6">Loading users...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Manage Users</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm bg-white shadow rounded">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-t">
                <td className="p-3">{u.name}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">{u.role}</td>
                <td className="p-3">{u.status}</td>
                <td className="p-3 flex gap-2">
                  <button
                    onClick={() =>
                      changeRole(u._id, u.role === "general" ? "volunteer" : "general")
                    }
                    className="px-2 py-1 border rounded hover:bg-gray-200"
                  >
                    Change Role
                  </button>
                  <button
                    onClick={() =>
                      changeStatus(u._id, u.status === "active" ? "blocked" : "active")
                    }
                    className="px-2 py-1 border rounded hover:bg-gray-200"
                  >
                    {u.status === "active" ? "Block" : "Unblock"}
                  </button>
                  <button
                    onClick={() => deleteUser(u._id)}
                    className="px-2 py-1 border rounded hover:bg-red-200 text-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan="5" className="p-3 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
