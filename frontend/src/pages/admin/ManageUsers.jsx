// src/pages/admin/ManageUsers.jsx
import React, { useEffect, useState } from "react";
import { getUsers, changeUserRole, changeUserStatus, deleteUser } from "../../api/admin";

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = async () => {
    try {
      const res = await getUsers();
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (id, role) => {
    await changeUserRole(id, role);
    fetchUsers();
  };

  const handleStatusChange = async (id, status) => {
    await changeUserStatus(id, status);
    fetchUsers();
  };

  const handleDelete = async (id) => {
    await deleteUser(id);
    fetchUsers();
  };

  if (loading) return <div className="p-6">Loading users...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Manage Users</h1>
      <table className="w-full text-left text-sm bg-white shadow rounded overflow-x-auto">
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
          {users.map((user) => (
            <tr key={user._id} className="border-t">
              <td className="p-3">{user.name}</td>
              <td className="p-3">{user.email}</td>
              <td className="p-3">{user.role}</td>
              <td className="p-3">{user.status}</td>
              <td className="p-3 flex gap-2">
                <button onClick={() => handleRoleChange(user._id, user.role === "admin" ? "user" : "admin")}>
                  Change Role
                </button>
                <button onClick={() => handleStatusChange(user._id, user.status === "active" ? "blocked" : "active")}>
                  {user.status === "active" ? "Block" : "Unblock"}
                </button>
                <button onClick={() => handleDelete(user._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

