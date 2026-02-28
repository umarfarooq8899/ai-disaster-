import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import * as UserAPI from "../../api/users";
import { createPortal } from "react-dom";
import toast, { Toaster } from "react-hot-toast";
import { AuthContext } from "../../context/AuthContext";

/* ================= DELETE MODAL (PORTAL) ================= */
function DeleteUserModal({ user, onClose, onConfirm }) {
  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50"
      onClick={onClose} // click outside to close
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()} // prevent close on inside click
      >
        <h2 className="text-xl font-semibold text-gray-800 mb-3">
          Delete User
        </h2>

        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to delete{" "}
          <span className="font-semibold">{user?.name}</span>?
          <br />
          <span className="text-red-600 font-medium">
            This action cannot be undone.
          </span>
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ================= MAIN COMPONENT ================= */
export default function ManageUsers() {
  const { user, token } = useContext(AuthContext);

  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  /* ================= FETCH USERS ================= */
  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      // Use the API client function
      const data = await UserAPI.getAllUsers(token);
      setUsers(data);
      setFilteredUsers(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  /* ================= FILTERS ================= */
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

  /* ================= STATUS CHANGE ================= */
  const changeStatus = async (id, status) => {
    try {
      await axios.patch(
        `/api/users/${id}/status`, // Use relative path with proxy
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("User status updated");
      fetchUsers();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  /* ================= DELETE ================= */
  const confirmDelete = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const deleteUser = async () => {
    try {
      await axios.delete(
        `/api/users/${selectedUser._id}`, // Use relative path with proxy
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("User deleted successfully");
      setShowDeleteModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      toast.error("Failed to delete user");
    }
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
      {/* Toast Container */}
      <Toaster position="top-right" />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-gray-800">
          User Management
        </h1>
        <p className="text-sm text-gray-500">
          Manage user status and access
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm"
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="volunteer">Volunteer</option>
          <option value="general">General</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm"
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
              <th className="p-4 text-left">Name</th>
              <th className="p-4 text-left">Email</th>
              <th className="p-4 text-center">Role</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u._id} className="border-t hover:bg-gray-50">
                <td className="p-4 font-medium text-left">{u.name}</td>
                <td className="p-4 text-gray-600 text-left">{u.email}</td>

                <td className="p-4 text-center">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold
                      ${u.role === "admin"
                        ? "bg-purple-100 text-purple-700"
                        : u.role === "volunteer"
                          ? "bg-brand-100 text-brand-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                  >
                    {u.role}
                  </span>
                </td>

                <td className="p-4 text-center">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold
                      ${u.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                      }`}
                  >
                    {u.status}
                  </span>
                </td>

                <td className="p-4 flex justify-center gap-2">
                  <button
                    onClick={() =>
                      changeStatus(
                        u._id,
                        u.status === "active" ? "blocked" : "active"
                      )
                    }
                    className={`px-3 py-1 text-xs rounded-md text-white
                      ${u.status === "active"
                        ? "bg-yellow-500 hover:bg-yellow-600"
                        : "bg-green-500 hover:bg-green-600"
                      }`}
                  >
                    {u.status === "active" ? "Block" : "Unblock"}
                  </button>

                  <button
                    onClick={() => confirmDelete(u)}
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

      {/* Delete Modal */}
      {showDeleteModal && (
        <DeleteUserModal
          user={selectedUser}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedUser(null);
          }}
          onConfirm={deleteUser}
        />
      )}
    </div>
  );
}
