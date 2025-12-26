import React from "react";

const mockUsers = [
  { id: 1, name: "Ali Khan", email: "ali@mail.com", role: "user", status: "active" },
  { id: 2, name: "Sara Ahmed", email: "sara@mail.com", role: "admin", status: "active" },
  { id: 3, name: "Usman Tariq", email: "usman@mail.com", role: "volunteer", status: "blocked" },
];

const roleColor = {
  admin: "bg-purple-100 text-purple-700",
  user: "bg-blue-100 text-blue-700",
  volunteer: "bg-green-100 text-green-700",
};

export default function ManageUsers() {
  return (
    <div className="space-y-6">

      {/* PAGE HEADER */}
      <div>
        <h1 className="text-2xl font-extrabold">Manage Users</h1>
        <p className="text-slate-600">
          View and control registered users
        </p>
      </div>

      {/* USERS TABLE */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {mockUsers.map((user) => (
              <tr key={user.id} className="border-t">
                <td className="p-3 font-medium">{user.name}</td>
                <td className="p-3 text-slate-600">{user.email}</td>

                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${roleColor[user.role]}`}
                  >
                    {user.role}
                  </span>
                </td>

                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      user.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {user.status}
                  </span>
                </td>

                <td className="p-3 space-x-2">
                  <button className="btn-outline text-xs">
                    Change Role
                  </button>
                  <button className="btn-danger text-xs">
                    {user.status === "active" ? "Block" : "Unblock"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
