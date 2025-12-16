import React, { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext";

export default function Profile() {
  const { user } = useContext(AuthContext);
  const [avatar, setAvatar] = useState(null);

  if (!user) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-md max-w-md mx-auto mt-10 text-center">
        <h2 className="text-2xl font-bold mb-2 text-red-600">
          No user logged in
        </h2>
        <p className="text-gray-600">Please login to view your profile.</p>
      </div>
    );
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(URL.createObjectURL(file));
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 space-y-8">

      {/* PROFILE HEADER */}
      <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col md:flex-row items-center gap-6">
        
        {/* AVATAR */}
        <div className="relative">
          <div className="h-32 w-32 rounded-full bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center overflow-hidden text-white text-4xl font-bold">
            {avatar ? (
              <img
                src={avatar}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            ) : (
              user.name?.[0]?.toUpperCase()
            )}
          </div>

          <label className="absolute bottom-1 right-1 bg-white p-2 rounded-full shadow cursor-pointer hover:bg-gray-100 transition">
            📷
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* USER INFO */}
        <div className="text-center md:text-left">
          <h2 className="text-3xl font-bold text-gray-800">
            {user.name}
          </h2>
          <p className="text-gray-500">{user.email || "Email not provided"}</p>

          <span className="inline-block mt-2 px-4 py-1 rounded-full text-sm font-semibold bg-blue-50 text-blue-600 capitalize">
            {user.role}
          </span>
        </div>
      </div>

      {/* PROFILE DETAILS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="text-sm font-semibold text-gray-500 mb-1">Full Name</h3>
          <p className="text-lg text-gray-800">{user.name}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="text-sm font-semibold text-gray-500 mb-1">Email</h3>
          <p className="text-lg text-gray-800">
            {user.email || "Not provided"}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="text-sm font-semibold text-gray-500 mb-1">Role</h3>
          <p className="text-lg text-gray-800 capitalize">{user.role}</p>
        </div>

      </div>

      {/* ACTIONS */}
      <div className="flex justify-end gap-4">
        <button
          onClick={() => alert("Edit profile functionality coming soon!")}
          className="px-6 py-3 rounded-xl border hover:bg-gray-100 transition"
        >
          Cancel
        </button>
        <button
          onClick={() => alert("Profile saved (mock)")}
          className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 transition text-white font-semibold"
        >
          Save Changes
        </button>
      </div>

    </div>
  );
}
