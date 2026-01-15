import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Select from "react-select";
import { AuthContext } from "../../context/AuthContext";

// Rescue & NGO options
const rescueOrgs = [
  { value: "Rescue 1122", label: "Rescue 1122" },
  { value: "Edhi Foundation", label: "Edhi Foundation" },
  { value: "Al-Khidmat Foundation", label: "Al-Khidmat Foundation" },
  { value: "Pakistan Red Crescent", label: "Pakistan Red Crescent" },
];

const ngoOrgs = [
  { value: "Edhi Foundation", label: "Edhi Foundation" },
  { value: "Al-Khidmat Foundation", label: "Al-Khidmat Foundation" },
  { value: "Saylani Welfare", label: "Saylani Welfare" },
  { value: "Aman Foundation", label: "Aman Foundation" },
];

// Provinces & Cities
const pakistanData = {
  Punjab: ["Lahore", "Rawalpindi", "Islamabad", "Faisalabad"],
  Sindh: ["Karachi", "Hyderabad", "Sukkur"],
  KPK: ["Peshawar", "Mardan", "Abbottabad"],
  Balochistan: ["Quetta", "Gwadar", "Turbat"],
  Islamabad: ["Islamabad"],
  "Gilgit-Baltistan": ["Gilgit", "Skardu"],
  AJK: ["Muzaffarabad", "Mirpur"],
};

export default function Signup() {
  const navigate = useNavigate();
  const { signupUser, createVolunteerProfile, getDashboardPath } =
    useContext(AuthContext);

  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "volunteer", // default volunteer
  });

  const [volProfile, setVolProfile] = useState({
    phone: "",
    province: "",
    city: "",
    organizationType: "",
    organization: "",
  });

  const [selectedProvince, setSelectedProvince] = useState(null);

  const provinceOptions = Object.keys(pakistanData).map((p) => ({ value: p, label: p }));
  const cityOptions = selectedProvince
    ? pakistanData[selectedProvince.value].map((c) => ({ value: c, label: c }))
    : [];

  // ================= Step 1: Signup =================
  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.name || !form.email || !form.password) return setError("All fields are required");

    const res = await signupUser(form);

    if (!res.success) return setError(res.message);

    if (form.role === "volunteer") {
      setSuccess("Account created! Please complete your profile.");
      setStep(2);
    } else {
      setSuccess("Account created! Redirecting...");
      setTimeout(() => navigate(getDashboardPath(form.role)), 1500);
    }
  };

  // ================= Step 2: Volunteer Profile =================
  const handleVolunteerProfile = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const { phone, province, city, organizationType, organization } = volProfile;

    if (!phone || !province || !city || !organizationType || !organization)
      return setError("All volunteer fields are required");

    const res = await createVolunteerProfile(volProfile);

    if (!res.success) return setError(res.message);

    setSuccess("Volunteer profile created! Redirecting...");
    setTimeout(() => navigate(getDashboardPath("volunteer")), 1500);
  };

  // ================= Render =================
  return (
    <div className="min-h-screen flex justify-center items-start bg-gray-50 py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 border shadow-md rounded-2xl">
          <h1 className="text-3xl font-bold text-center">Sign Up</h1>

          {error && <div className="mt-4 text-sm text-red-700 bg-red-50 border p-3 rounded">{error}</div>}
          {success && <div className="mt-4 text-sm text-green-700 bg-green-50 border p-3 rounded">{success}</div>}

          {step === 1 && (
            <form onSubmit={handleSignup} className="mt-6 space-y-4">
              <input
                className="input w-full"
                placeholder="Full Name"
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <input
                type="email"
                className="input w-full"
                placeholder="Email"
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <input
                type="password"
                className="input w-full"
                placeholder="Password"
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <select
                className="input w-full"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="general">General User</option>
                <option value="volunteer">Volunteer</option>
              </select>
              <button className="btn-primary w-full">Create Account</button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVolunteerProfile} className="mt-6 space-y-4">
              <input
                className="input w-full"
                placeholder="Phone Number"
                onChange={(e) => setVolProfile({ ...volProfile, phone: e.target.value })}
              />

              <Select
                options={provinceOptions}
                placeholder="Select Province"
                onChange={(prov) => {
                  setSelectedProvince(prov);
                  setVolProfile({ ...volProfile, province: prov.value, city: "" });
                }}
              />

              <Select
                options={cityOptions}
                placeholder="Select City"
                isDisabled={!selectedProvince}
                onChange={(city) => setVolProfile({ ...volProfile, city: city.value })}
              />

              <select
                className="input w-full"
                value={volProfile.organizationType}
                onChange={(e) =>
                  setVolProfile({ ...volProfile, organizationType: e.target.value, organization: "" })
                }
              >
                <option value="">Select Organization Type</option>
                <option value="rescue">Rescue Organization</option>
                <option value="ngo">NGO</option>
              </select>

              {volProfile.organizationType === "rescue" && (
                <Select
                  options={rescueOrgs}
                  placeholder="Select Rescue Organization"
                  onChange={(org) => setVolProfile({ ...volProfile, organization: org.value })}
                />
              )}

              {volProfile.organizationType === "ngo" && (
                <Select
                  options={ngoOrgs}
                  placeholder="Select NGO"
                  onChange={(org) => setVolProfile({ ...volProfile, organization: org.value })}
                />
              )}

              <button className="btn-primary w-full">Complete Volunteer Profile</button>
            </form>
          )}

          <p className="mt-4 text-sm text-center">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-600 font-semibold">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
