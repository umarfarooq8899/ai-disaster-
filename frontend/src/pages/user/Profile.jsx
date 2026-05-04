import React, { useContext, useState, useEffect, useRef } from "react";
import { AuthContext } from "../../context/AuthContext";
import axios from "axios";
import toast from "react-hot-toast";
import {
  User, Mail, Shield, Phone, MapPin, Lock,
  Edit3, Save, X, Camera, Settings, Activity,
  Verified, Zap, Globe, Briefcase, ChevronRight,
  Heart, Star, Trash2
} from "lucide-react";
import Select from "react-select";
import { pakistanData } from "../../data/pakistan_cities";
import { getFileUrl } from "../../utils/fileUtils";

export default function Profile() {
  const { user, token, updateUser } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("general");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [volunteerData, setVolunteerData] = useState(null);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    province: null,
    city: null,
    organizationType: "",
    organization: "",
    skills: [],
    profilePicture: null // To hold the new file being uploaded
  });

  const [previewUrl, setPreviewUrl] = useState(getFileUrl(user?.profilePicture));
  const [orgs, setOrgs] = useState([]);
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

  useEffect(() => {
    if (!formData.organizationType) {
      setOrgs([]);
      return;
    }

    async function fetchOrgs() {
      try {
        const type = formData.organizationType === "RescueOrganization" ? "rescue" : "ngo";
        const res = await axios.get(`/api/organizations/${type}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrgs(res.data.map(o => ({ value: o._id, label: o.name })));
      } catch (err) {
        console.error("Failed to fetch organizations", err);
      }
    }
    fetchOrgs();
  }, [formData.organizationType]);

  const fetchVolunteerProfile = async () => {
    try {
      const res = await axios.get("/api/volunteer/me", {
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
          organizationType: v.organizationType || "",
          organization: v.organization?._id || "",
        }));
      }
    } catch (err) {
      console.error("Failed to fetch volunteer profile", err);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, profilePicture: file });
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleProfileSave = async () => {
    try {
      setLoading(true);
      const data = new FormData();
      data.append("name", formData.name);
      data.append("email", formData.email);
      if (formData.profilePicture) {
        data.append("profilePicture", formData.profilePicture);
      }

      const res = await axios.patch("/api/users/me", data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        },
      });

      updateUser(res.data.user);

      if (user.role === "volunteer") {
        await axios.post("/api/volunteer/create", {
          ...formData,
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      toast.success("Profile refined and synchronized!");
      setIsEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Sync failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (pwdData.newPassword !== pwdData.confirmPassword) {
      return toast.error("Key mismatch detected");
    }
    try {
      setLoading(true);
      await axios.patch("/api/users/me/password", {
        oldPassword: pwdData.oldPassword,
        newPassword: pwdData.newPassword,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Security credentials updated");
      setPwdData({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Encryption update failed");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
    </div>
  );

  const tabs = [
    { id: "general", label: "Overview", icon: User },
    ...(user.role === "volunteer" ? [{ id: "volunteer", label: "Volunteer Node", icon: Activity }] : []),
    { id: "security", label: "Security", icon: Lock },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* HEADER SECTION - REFINED BRAND THEME */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="h-48 bg-gradient-to-r from-brand-600 via-brand-700 to-brand-800 relative">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]" />
          </div>
          <div className="px-6 md:px-12 pb-12 -mt-24 flex flex-col md:flex-row items-center md:items-end gap-8">
            <div className="relative group/avatar">
              <div className="h-48 w-48 rounded-[3.5rem] bg-white p-2 shadow-2xl ring-8 ring-white/50 relative overflow-hidden transition-transform duration-500 hover:scale-[1.02]">
                {previewUrl ? (
                  <img src={previewUrl} alt="Avatar" className="h-full w-full object-cover rounded-[3rem]" />
                ) : (
                  <div className="h-full w-full rounded-[3rem] bg-slate-50 flex items-center justify-center text-7xl font-bold text-slate-200">
                    {user.name?.[0]}
                  </div>
                )}
                {isEditing && (
                  <div
                    onClick={() => fileInputRef.current.click()}
                    className="absolute inset-0 bg-brand-900/60 backdrop-blur-sm flex flex-col items-center justify-center text-white cursor-pointer opacity-0 group-hover/avatar:opacity-100 transition-all duration-300"
                  >
                    <Camera className="w-10 h-10 mb-2" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-center px-4">Change Profile Picture</span>
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>
              <div className="absolute bottom-2 right-2 bg-brand-600 text-white p-3.5 rounded-2xl shadow-xl border-4 border-white">
                <Verified className="w-5 h-5" />
              </div>
            </div>

            <div className="flex-1 space-y-2 text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center md:items-center gap-4">
                <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">{user.name}</h1>
                <span className="px-4 py-1.5 rounded-full bg-brand-50 text-brand-700 text-[10px] font-bold uppercase tracking-widest border border-brand-100">
                  {user.role?.replace("_", " ")}
                </span>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-2.5">
                <Mail className="w-5 h-5 text-slate-400" />
                <p className="text-slate-500 font-medium text-lg">{user.email}</p>
              </div>
            </div>

            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-3 px-8 py-4 bg-brand-600 text-white rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-brand-700 transition-all shadow-lg active:scale-95"
              >
                <Settings className="w-5 h-5" /> Edit Profile
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* NAV TABS */}
          <div className="lg:col-span-3 space-y-3 lg:sticky lg:top-8">
            <div className="bg-white p-3 rounded-[2rem] border border-slate-100 shadow-sm space-y-1.5">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm transition-all duration-300 ${activeTab === tab.id
                    ? "bg-brand-600 text-white shadow-md translate-x-1"
                    : "text-slate-400 hover:text-brand-600 hover:bg-brand-50"
                    }`}
                >
                  <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? "text-white" : "text-slate-300"}`} />
                  {tab.label}
                </button>
              ))}
            </div>

            {isEditing && (
              <div className="p-1 space-y-3">
                <button
                  onClick={handleProfileSave}
                  disabled={loading}
                  className="w-full py-5 bg-brand-600 text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-lg hover:bg-brand-700 transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                  {loading ? <Activity className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setPreviewUrl(getFileUrl(user?.profilePicture));
                  }}
                  className="w-full py-5 bg-white text-rose-500 rounded-2xl font-bold uppercase tracking-widest text-xs border border-rose-100 hover:bg-rose-50 transition-all flex items-center justify-center gap-3"
                >
                  <X className="w-5 h-5" /> Cancel
                </button>
              </div>
            )}
          </div>

          {/* TAB CONTENT Area */}
          <div className="lg:col-span-9">
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-50 p-8 md:p-12 min-h-[500px] relative overflow-hidden">

              {/* GENERAL TAB */}
              {activeTab === "general" && (
                <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="border-l-4 border-brand-500 pl-6 py-1">
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Account Information</h2>
                    <p className="text-slate-400 text-sm mt-1">Update your basic profile and contact details.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                    <div className="space-y-2.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                      {isEditing ? (
                        <input
                          className="w-full px-6 py-4 rounded-xl bg-slate-50 border-2 border-transparent focus:border-brand-500 focus:bg-white transition-all outline-none font-semibold text-slate-800"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      ) : (
                        <div className="px-6 py-4 bg-slate-50/50 rounded-xl border border-slate-100 text-lg font-bold text-slate-900">
                          {user.name}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                      {isEditing ? (
                        <input
                          className="w-full px-6 py-4 rounded-xl bg-slate-50 border-2 border-transparent focus:border-brand-500 focus:bg-white transition-all outline-none font-semibold text-slate-800"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      ) : (
                        <div className="px-6 py-4 bg-slate-50/50 rounded-xl border border-slate-100 text-lg font-bold text-slate-900 break-all">
                          {user.email}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                      {isEditing ? (
                        <input
                          className="w-full px-6 py-4 rounded-xl bg-slate-50 border-2 border-transparent focus:border-brand-500 focus:bg-white transition-all outline-none font-semibold text-slate-800"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+92 XXX XXXXXXX"
                        />
                      ) : (
                        <div className="px-6 py-4 bg-slate-50/50 rounded-xl border border-slate-100 text-lg font-bold text-slate-900">
                          {formData.phone || "---"}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Account Role</label>
                      <div className="px-6 py-4 bg-slate-900 text-white rounded-xl text-lg font-bold uppercase tracking-wider flex items-center justify-between shadow-sm">
                        {user.role?.replace("_", " ")}
                        <Shield className="w-5 h-5 text-brand-400" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* VOLUNTEER TAB (Only if Role matches) */}
              {activeTab === "volunteer" && user.role === "volunteer" && (
                <div className="space-y-12 animate-in fade-in duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                      <h4 className="text-xl font-black text-slate-900 flex items-center gap-3">
                        <Globe className="w-6 h-6 text-brand-500" /> Operational Base
                      </h4>
                      {isEditing ? (
                        <div className="space-y-4">
                          <Select
                            options={Object.keys(pakistanData).map(p => ({ value: p, label: p }))}
                            placeholder="PROVINCE"
                            value={formData.province ? { value: formData.province, label: formData.province } : null}
                            onChange={(option) => setFormData({ ...formData, province: option.value, city: null })}
                            classNames={{ control: () => "!rounded-2xl !bg-slate-50 !border-0 !p-3 !font-black !shadow-none" }}
                          />
                          <Select
                            options={
                              formData.province && pakistanData[formData.province]
                                ? pakistanData[formData.province].map(c => ({ value: c, label: c }))
                                : []
                            }
                            placeholder="CITY"
                            isDisabled={!formData.province}
                            value={formData.city ? { value: formData.city, label: formData.city } : null}
                            onChange={(option) => setFormData({ ...formData, city: option.value })}
                            classNames={{ control: () => "!rounded-2xl !bg-slate-50 !border-0 !p-3 !font-black !shadow-none" }}
                          />
                        </div>
                      ) : (
                        <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-6">
                          <div className="p-4 bg-white rounded-2xl shadow-sm text-brand-600">
                            <MapPin className="w-8 h-8" />
                          </div>
                          <p className="text-xl font-black text-slate-800">{formData.city || "N/A"}, {formData.province || "--"}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-6">
                      <h4 className="text-xl font-black text-slate-900 flex items-center gap-3">
                        <Briefcase className="w-6 h-6 text-brand-500" /> Affiliation
                      </h4>
                      {isEditing ? (
                        <div className="space-y-4">
                          <select
                            className="w-full px-6 py-4 rounded-2xl bg-white border border-slate-100 text-slate-800 font-black uppercase tracking-widest outline-none shadow-sm"
                            value={formData.organizationType}
                            onChange={(e) => setFormData({ ...formData, organizationType: e.target.value, organization: "" })}
                          >
                            <option value="">TYPE</option>
                            <option value="RescueOrganization">Rescue</option>
                            <option value="NgoOrganization">NGO</option>
                          </select>
                          {formData.organizationType && (
                            <Select
                              options={orgs}
                              placeholder="HUB"
                              value={orgs.find(o => o.value === formData.organization) || null}
                              onChange={(opt) => setFormData({ ...formData, organization: opt.value })}
                              classNames={{ control: () => "!rounded-2xl !bg-white !border-slate-100 !p-3 !font-black !shadow-sm" }}
                            />
                          )}
                        </div>
                      ) : (
                        <div className="p-8 bg-slate-900 rounded-3xl text-white shadow-xl">
                          <p className="text-[10px] font-black text-brand-400 uppercase tracking-widest mb-1">Active Partnership</p>
                          <p className="text-xl font-black">{volunteerData?.organization?.name || "Independent Network"}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-xl font-black text-slate-900 flex items-center gap-3">
                      <Heart className="w-6 h-6 text-rose-500" /> Competency Matrix
                    </h4>
                    {isEditing ? (
                      <div className="flex flex-wrap gap-4">
                        {["medical", "technical", "rescue", "logistics", "communication", "driving", "swimming", "navigation"].map(s => (
                          <button
                            key={s}
                            onClick={() => {
                              const newSkills = formData.skills.includes(s)
                                ? formData.skills.filter(sk => sk !== s)
                                : [...formData.skills, s];
                              setFormData({ ...formData, skills: newSkills });
                            }}
                            className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.skills.includes(s)
                              ? "bg-slate-900 text-white"
                              : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                              }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {formData.skills.map(s => (
                          <div key={s} className="p-5 bg-white border border-slate-100 rounded-2xl text-center shadow-sm">
                            <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{s}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SECURITY TAB */}
              {activeTab === "security" && (
                <div className="max-w-xl space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="border-l-4 border-brand-500 pl-6 py-1">
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Security Settings</h2>
                    <p className="text-slate-400 text-sm mt-1">Manage your account password and security preferences.</p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Current Password</label>
                      <div className="relative">
                        <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                        <input
                          type="password"
                          className="w-full pl-14 pr-6 py-5 rounded-xl bg-slate-50 border-2 border-transparent focus:border-brand-500 focus:bg-white transition-all outline-none font-semibold text-slate-800"
                          value={pwdData.oldPassword}
                          onChange={(e) => setPwdData({ ...pwdData, oldPassword: e.target.value })}
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                        <input
                          type="password"
                          className="w-full px-6 py-5 rounded-xl bg-slate-50 border-2 border-transparent focus:border-brand-500 focus:bg-white transition-all outline-none font-semibold text-slate-800"
                          value={pwdData.newPassword}
                          onChange={(e) => setPwdData({ ...pwdData, newPassword: e.target.value })}
                          placeholder="New password"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Confirm Password</label>
                        <input
                          type="password"
                          className="w-full px-6 py-5 rounded-xl bg-slate-50 border-2 border-transparent focus:border-brand-500 focus:bg-white transition-all outline-none font-semibold text-slate-800"
                          value={pwdData.confirmPassword}
                          onChange={(e) => setPwdData({ ...pwdData, confirmPassword: e.target.value })}
                          placeholder="Confirm new password"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handlePasswordChange}
                      disabled={loading || !pwdData.oldPassword || !pwdData.newPassword}
                      className="w-full py-5 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-black transition-all shadow-lg mt-4 disabled:opacity-50"
                    >
                      {loading ? <Activity className="w-5 h-5 animate-spin mx-auto" /> : "Update Password"}
                    </button>
                  </div>

                  <div className="pt-8 border-t border-slate-100">
                    <div className="p-6 bg-brand-50 rounded-3xl border border-brand-100 flex items-center gap-5">
                      <div className="h-14 w-14 bg-white rounded-2xl shadow-md flex items-center justify-center text-brand-600">
                        <Shield className="w-7 h-7" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-slate-900">Two-Factor Authentication</p>
                        <p className="text-slate-500 text-sm">Enhanced security is coming soon to your account.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
