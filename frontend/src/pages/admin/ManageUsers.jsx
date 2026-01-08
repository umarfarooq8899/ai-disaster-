import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";

export default function ManageUsers() {
  const { user, token } = useContext(AuthContext);

  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get("http://localhost:5000/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
      setFilteredUsers(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  useEffect(() => {
    let data = [...users];

    if (roleFilter !== "all") {
      data = data.filter((u) => u.role === roleFilter);
    }

    if (statusFilter !== "all") {
      data = data.filter((u) => u.status === statusFilter);
    }

    setFilteredUsers(data);
  }, [roleFilter, statusFilter, users]);

  const changeRole = async (id, role) => {
    await axios.patch(
      `http://localhost:5000/api/users/${id}/role`,
      { role },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    fetchUsers();
  };

  const changeStatus = async (id, status) => {
    await axios.patch(
      `http://localhost:5000/api/users/${id}/status`,
      { status },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    fetchUsers();
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    await axios.delete(`http://localhost:5000/api/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchUsers();
  };

  useEffect(() => {
    if (user?.role === "admin") fetchUsers();
  }, [user]);

  if (loading)
    return <div className="p-6 text-gray-500">Loading users...</div>;

  if (error)
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-md">
        {error}
      </div>
    );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-gray-800">User Management</h1>
        <p className="text-sm text-gray-500">
          Filter, manage roles and user access
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm focus:ring focus:ring-blue-200"
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="volunteer">Volunteer</option>
          <option value="general">General</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm focus:ring focus:ring-blue-200"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Email</th>
              <th className="p-4">Role</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u._id} className="border-t hover:bg-gray-50">
                <td className="p-4 font-medium">{u.name}</td>
                <td className="p-4 text-gray-600">{u.email}</td>

                {/* Role Badge */}
                <td className="p-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold
                      ${
                        u.role === "admin"
                          ? "bg-purple-100 text-purple-700"
                          : u.role === "volunteer"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                  >
                    {u.role}
                  </span>
                </td>

                {/* Status Badge */}
                <td className="p-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold
                      ${
                        u.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                  >
                    {u.status}
                  </span>
                </td>

                {/* Actions */}
                <td className="p-4 flex justify-center gap-2">
                  <button
                    onClick={() =>
                      changeRole(
                        u._id,
                        u.role === "general" ? "volunteer" : "general"
                      )
                    }
                    className="px-3 py-1 text-xs rounded-md bg-blue-500 text-white hover:bg-blue-600"
                  >
                    Change Role
                  </button>

                  <button
                    onClick={() =>
                      changeStatus(
                        u._id,
                        u.status === "active" ? "blocked" : "active"
                      )
                    }
                    className={`px-3 py-1 text-xs rounded-md text-white
                      ${
                        u.status === "active"
                          ? "bg-yellow-500 hover:bg-yellow-600"
                          : "bg-green-500 hover:bg-green-600"
                      }`}
                  >
                    {u.status === "active" ? "Block" : "Unblock"}
                  </button>

                  <button
                    onClick={() => deleteUser(u._id)}
                    className="px-3 py-1 text-xs rounded-md bg-red-500 text-white hover:bg-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan="5" className="p-6 text-center text-gray-500">
                  No users match the selected filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
