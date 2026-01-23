import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import axios from "axios";
import toast from "react-hot-toast";
import { User, Mail, Shield, Phone, MapPin, Star, Lock, Edit3, Save, X, Key } from "lucide-react";

export default function Profile() {
  const { user, token, logout, updateUser } = useContext(AuthContext);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [volunteerData, setVolunteerData] = useState(null);

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    city: "",
    province: "",
    skills: [],
  });

  const [pwdData, setPwdData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (user?.role === "volunteer") {
      fetchVolunteerProfile();
    }
  }, [user]);

  const fetchVolunteerProfile = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/volunteer/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        const v = res.data.volunteer;
        setVolunteerData(v);
        setFormData(prev => ({
          ...prev,
          phone: v.phone || "",
          city: v.city || "",
          province: v.province || "",
          skills: v.skills || [],
        }));
      }
    } catch (err) {
      console.error("Failed to fetch volunteer profile", err);
    }
  };

  const handleProfileSave = async () => {
    try {
      setLoading(true);
      // Update core user info
      await axios.patch("http://localhost:5000/api/users/me", {
        name: formData.name,
        email: formData.email,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      updateUser({
        name: formData.name,
        email: formData.email,
      });

      // Update volunteer info if applicable
      if (user.role === "volunteer") {
        await axios.post("http://localhost:5000/api/volunteer/create", {
          ...formData,
          organizationType: volunteerData?.organizationType,
          organization: volunteerData?.organization?._id,
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      toast.success("Profile updated successfully! Some changes might require re-login.");
      setIsEditing(false);
      // Optionally refresh context or local storage here if needed
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (pwdData.newPassword !== pwdData.confirmPassword) {
      return toast.error("New passwords do not match");
    }
    try {
      setLoading(true);
      await axios.patch("http://localhost:5000/api/users/me/password", {
        oldPassword: pwdData.oldPassword,
        newPassword: pwdData.newPassword,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Password updated successfully!");
      setShowPasswordModal(false);
      setPwdData({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="p-10 text-center">Please login...</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">

      {/* HEADER CARD */}
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <div className="h-32 bg-gradient-to-r from-brand-600 to-brand-800" />
        <div className="px-8 pb-8 -mt-12 flex flex-col md:flex-row items-end gap-6">
          <div className="h-32 w-32 rounded-3xl bg-white p-2 shadow-2xl">
            <div className="h-full w-full rounded-2xl bg-gray-100 flex items-center justify-center text-4xl font-bold text-brand-600 border-2 border-brand-50">
              {user.name?.[0]?.toUpperCase()}
            </div>
          </div>
          <div className="flex-1 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-gray-500 flex items-center gap-2 mt-1">
              <Mail className="w-4 h-4" /> {user.email}
            </p>
          </div>
          <div className="flex gap-3 mb-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-semibold transition-all ${isEditing ? "bg-gray-100 text-gray-600" : "bg-brand-50 text-brand-600 hover:bg-brand-100"
                }`}
            >
              {isEditing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
              {isEditing ? "Cancel" : "Edit Profile"}
            </button>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gray-900 text-white font-semibold hover:bg-black transition-all shadow-lg shadow-gray-200"
            >
              <Key className="w-4 h-4" /> Change Password
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: CORE INFO */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-brand-600" /> Account Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-500 ml-1">Full Name</label>
                {isEditing ? (
                  <input
                    className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all outline-none"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                ) : (
                  <p className="px-4 py-3 text-lg font-medium text-gray-800 bg-gray-50 rounded-2xl border border-transparent">{user.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-500 ml-1">Email Address</label>
                {isEditing ? (
                  <input
                    className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all outline-none"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                ) : (
                  <p className="px-4 py-3 text-lg font-medium text-gray-800 bg-gray-50 rounded-2xl border border-transparent">{user.email}</p>
                )}
              </div>
            </div>
          </div>

          {/* VOLUNTEER SPECIFIC SECTION */}
          {(user.role === "volunteer" || volunteerData) && (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 animate-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" /> Volunteer Profile
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-500 ml-1">Phone Number</label>
                  {isEditing ? (
                    <input
                      className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all outline-none"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  ) : (
                    <p className="px-4 py-3 text-lg font-medium text-gray-800 bg-gray-50 rounded-2xl flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" /> {formData.phone || "Not set"}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-500 ml-1">Location (Province, City)</label>
                  {isEditing ? (
                    <div className="flex gap-2">
                      <input
                        placeholder="Province"
                        className="w-1/2 px-4 py-3 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-brand-500 outline-none"
                        value={formData.province}
                        onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                      />
                      <input
                        placeholder="City"
                        className="w-1/2 px-4 py-3 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-brand-500 outline-none"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      />
                    </div>
                  ) : (
                    <p className="px-4 py-3 text-lg font-medium text-gray-800 bg-gray-50 rounded-2xl flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" /> {formData.province}, {formData.city}
                    </p>
                  )}
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-semibold text-gray-500 ml-1">Skills</label>
                  {isEditing ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {["medical", "technical", "rescue", "logistics", "communication"].map(s => (
                        <button
                          key={s}
                          onClick={() => {
                            const newSkills = formData.skills.includes(s)
                              ? formData.skills.filter(sk => sk !== s)
                              : [...formData.skills, s];
                            setFormData({ ...formData, skills: newSkills });
                          }}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${formData.skills.includes(s)
                            ? "bg-brand-600 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {formData.skills.map(s => (
                        <span key={s} className="px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-sm font-semibold border border-amber-100 uppercase tracking-wider">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: STATUS & QUICK ACTIONS */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="inline-block p-4 rounded-3xl bg-blue-50 text-blue-600 mb-4">
              <Shield className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-gray-900">Account Role</h4>
            <p className="text-gray-500 capitalize mb-4">{user.role}</p>
            <div className="py-2 px-4 rounded-2xl bg-green-50 text-green-700 text-sm font-bold inline-block border border-green-100 shadow-sm shadow-green-50">
              Active Account
            </div>
          </div>

          {isEditing && (
            <button
              onClick={handleProfileSave}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-3xl bg-brand-600 text-white font-bold hover:bg-brand-700 transition-all shadow-xl shadow-brand-200 disabled:opacity-50"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
              Save All Changes
            </button>
          )}
        </div>
      </div>

      {/* PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Lock className="w-6 h-6 text-brand-600" /> Security
              </h3>
              <button onClick={() => setShowPasswordModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-600">Current Password</label>
                <input
                  type="password"
                  className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-brand-500 outline-none transition-all"
                  value={pwdData.oldPassword}
                  onChange={(e) => setPwdData({ ...pwdData, oldPassword: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-600">New Password</label>
                <input
                  type="password"
                  className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-brand-500 outline-none transition-all"
                  value={pwdData.newPassword}
                  onChange={(e) => setPwdData({ ...pwdData, newPassword: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-600">Confirm New Password</label>
                <input
                  type="password"
                  className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-brand-500 outline-none transition-all"
                  value={pwdData.confirmPassword}
                  onChange={(e) => setPwdData({ ...pwdData, confirmPassword: e.target.value })}
                />
              </div>

              <button
                onClick={handlePasswordChange}
                disabled={loading || !pwdData.oldPassword || !pwdData.newPassword}
                className="w-full mt-4 py-4 rounded-2xl bg-brand-600 text-white font-bold hover:bg-brand-700 shadow-xl shadow-brand-100 transition-all disabled:opacity-50"
              >
                {loading ? "Updating..." : "Update Password"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

