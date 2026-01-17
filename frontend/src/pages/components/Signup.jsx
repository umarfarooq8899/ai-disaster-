import React, { useContext, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Select from "react-select";
import { AuthContext } from "../../context/AuthContext";
import axiosInstance from "../../api/axios";

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

// Skills
const skillsOptions = [
  { value: "medical", label: "Medical" },
  { value: "technical", label: "Technical" },
  { value: "rescue", label: "Rescue" },
  { value: "logistics", label: "Logistics" },
  { value: "communication", label: "Communication" },
];

export default function Signup() {
  const navigate = useNavigate();
  const { signupUser, createVolunteerProfile, getDashboardPath } =
    useContext(AuthContext);

  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [orgs, setOrgs] = useState([]);

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
    skills: [],
    available: true,
  });

  const [selectedProvince, setSelectedProvince] = useState(null);

  const provinceOptions = Object.keys(pakistanData).map((p) => ({ value: p, label: p }));
  const cityOptions = selectedProvince
    ? pakistanData[selectedProvince.value].map((c) => ({ value: c, label: c }))
    : [];

  // Fetch organizations based on type
  useEffect(() => {
    if (!volProfile.organizationType) {
      setOrgs([]);
      return;
    }

    async function fetchOrgs() {
      try {
        const type = volProfile.organizationType === "RescueOrganization" ? "rescue" : "ngo";
        const res = await axiosInstance.get(`/organizations/${type}`);
        setOrgs(res.data.map(o => ({ value: o._id, label: o.name })));
      } catch (err) {
        console.error("Failed to fetch organizations", err);
      }
    }
    fetchOrgs();
  }, [volProfile.organizationType]);

  // ================= Step 1: Signup =================
  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.name || !form.email || !form.password) return setError("All fields are required");

    setLoading(true);
    const res = await signupUser(form);
    setLoading(false);

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

    const { phone, province, city, organizationType, organization, skills } = volProfile;

    if (!phone || !province || !city || !organizationType || !organization || skills.length === 0)
      return setError("All fields are required");

    setLoading(true);
    const res = await createVolunteerProfile({
      ...volProfile,
      skills: skills.map(s => s.value)
    });
    setLoading(false);

    if (!res.success) return setError(res.message);

    setSuccess("Volunteer profile created! Redirecting...");
    setTimeout(() => navigate(getDashboardPath("volunteer")), 1500);
  };

  // ================= Render =================
  return (
    <div className="flex justify-center items-start py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 border shadow-md rounded-2xl">
          <h1 className="text-3xl font-bold text-center">Sign Up</h1>

          {error && <div className="mt-4 text-sm text-red-700 bg-red-50 border p-3 rounded">{error}</div>}
          {success && <div className="mt-4 text-sm text-green-700 bg-green-50 border p-3 rounded">{success}</div>}

          {step === 1 && (
            <form onSubmit={handleSignup} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                <input
                  className="input w-full"
                  placeholder="John Doe"
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="input w-full"
                  placeholder="john@example.com"
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  className="input w-full"
                  placeholder="••••••••"
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Role</label>
                <select
                  className="input w-full"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="general">General User</option>
                  <option value="volunteer">Volunteer</option>
                </select>
              </div>
              <button className="btn-primary w-full" disabled={loading}>
                {loading ? "Creating..." : "Create Account"}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVolunteerProfile} className="mt-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                <input
                  className="input w-full"
                  placeholder="+92 3XX XXXXXXX"
                  value={volProfile.phone}
                  onChange={(e) => setVolProfile({ ...volProfile, phone: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Province</label>
                <Select
                  options={provinceOptions}
                  placeholder="Select Province"
                  onChange={(prov) => {
                    setSelectedProvince(prov);
                    setVolProfile({ ...volProfile, province: prov.value, city: "" });
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">City</label>
                <Select
                  options={cityOptions}
                  placeholder="Select City"
                  isDisabled={!selectedProvince}
                  value={cityOptions.find(c => c.value === volProfile.city) || null}
                  onChange={(city) => setVolProfile({ ...volProfile, city: city.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Organization Type</label>
                <select
                  className="input w-full"
                  value={volProfile.organizationType}
                  onChange={(e) =>
                    setVolProfile({ ...volProfile, organizationType: e.target.value, organization: "" })
                  }
                >
                  <option value="">Select Organization Type</option>
                  <option value="RescueOrganization">Rescue Organization</option>
                  <option value="NgoOrganization">NGO</option>
                </select>
              </div>

              {volProfile.organizationType && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Organization</label>
                  <Select
                    options={orgs}
                    placeholder={`Select ${volProfile.organizationType === "RescueOrganization" ? "Rescue" : "NGO"}`}
                    value={orgs.find(o => o.value === volProfile.organization) || null}
                    onChange={(org) => setVolProfile({ ...volProfile, organization: org.value })}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Skills</label>
                <Select
                  isMulti
                  options={skillsOptions}
                  placeholder="Select Skills"
                  value={volProfile.skills}
                  onChange={(skills) => setVolProfile({ ...volProfile, skills })}
                />
              </div>

              <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <input
                  type="checkbox"
                  id="vol-available"
                  className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
                  checked={volProfile.available}
                  onChange={(e) => setVolProfile({ ...volProfile, available: e.target.checked })}
                />
                <label htmlFor="vol-available" className="text-sm font-semibold text-gray-700 cursor-pointer">
                  Available for active tasks
                </label>
              </div>

              <button className="btn-primary w-full" disabled={loading}>
                {loading ? "Saving..." : "Complete Volunteer Profile"}
              </button>
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
