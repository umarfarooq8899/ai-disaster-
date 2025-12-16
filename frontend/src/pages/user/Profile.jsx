import React, { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";

export default function Profile() {
  const { user } = useContext(AuthContext);

  if (!user) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-md max-w-md mx-auto mt-10 text-center">
        <h2 className="text-2xl font-bold mb-2 text-red-600">No user logged in</h2>
        <p className="text-gray-600">Please login to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 bg-white rounded-2xl shadow-lg p-8">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">My Profile</h2>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="p-4 bg-gray-50 rounded-lg shadow-inner">
          <h3 className="text-sm font-semibold text-gray-500 mb-1">Name</h3>
          <p className="text-gray-800 text-lg">{user.name}</p>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg shadow-inner">
          <h3 className="text-sm font-semibold text-gray-500 mb-1">Email</h3>
          <p className="text-gray-800 text-lg">{user.email || "Not provided"}</p>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg shadow-inner">
          <h3 className="text-sm font-semibold text-gray-500 mb-1">Role</h3>
          <p className="text-gray-800 text-lg capitalize">{user.role}</p>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg shadow-inner flex items-center justify-center">
          <button
            onClick={() => alert("Edit profile functionality coming soon!")}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 transition text-white font-semibold rounded-lg shadow-md"
          >
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  );
}
