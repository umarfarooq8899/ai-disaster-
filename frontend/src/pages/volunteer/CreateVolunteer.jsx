import React, { useContext, useState, useEffect } from "react";
import Select from "react-select";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

// Available rescue and NGO organizations
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

// Provinces and cities
const pakistanData = {
  Punjab: ["Lahore", "Rawalpindi", "Islamabad", "Faisalabad"],
  Sindh: ["Karachi", "Hyderabad", "Sukkur"],
  KPK: ["Peshawar", "Mardan", "Abbottabad"],
  Balochistan: ["Quetta", "Gwadar", "Turbat"],
  Islamabad: ["Islamabad"],
  "Gilgit-Baltistan": ["Gilgit", "Skardu"],
  AJK: ["Muzaffarabad", "Mirpur"],
};

// Volunteer skills
const skillsOptions = [
  { value: "medical", label: "Medical" },
  { value: "technical", label: "Technical" },
  { value: "rescue", label: "Rescue" },
  { value: "logistics", label: "Logistics" },
  { value: "communication", label: "Communication" },
];

export default function CreateVolunteer() {
  const navigate = useNavigate();
  const { user, createVolunteerProfile, getDashboardPath, getVolunteerProfile } = useContext(AuthContext);

  const provinceOptions = Object.keys(pakistanData).map((prov) => ({ value: prov, label: prov }));

  const [selectedProvince, setSelectedProvince] = useState(null);
  const [form, setForm] = useState({
    phone: "",
    province: "",
    city: "",
    organizationType: "",
    organization: "",
    skills: [],
    available: false,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const cityOptions = selectedProvince
    ? pakistanData[selectedProvince.value].map((city) => ({ value: city, label: city }))
    : [];

  // Fetch existing volunteer profile if editing
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await getVolunteerProfile();
        if (res.success && res.data) {
          setForm({
            ...res.data,
            skills: res.data.skills.map(skill => ({ value: skill, label: skill })),
          });
          if (res.data.province) setSelectedProvince({ value: res.data.province, label: res.data.province });
        }
      } catch (err) {
        console.log("Failed to fetch volunteer profile:", err);
      }
    }
    fetchProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const { phone, province, city, organizationType, organization, skills } = form;

    if (!phone || !province || !city || !organizationType || !organization || skills.length === 0) {
      return setError("All fields are required including skills.");
    }

    const phoneRegex = /^\+?\d{10,15}$/;
    if (!phoneRegex.test(phone)) return setError("Invalid phone number.");

    const res = await createVolunteerProfile({
      ...form,
      skills: skills.map(s => s.value),
    });

    if (!res.success) return setError(res.message);

    setSuccess("Volunteer profile created! Redirecting...");
    setTimeout(() => navigate(getDashboardPath("volunteer")), 1500);
  };

  return (
    <div className="min-h-screen flex justify-center items-start bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="p-8 bg-white border shadow-md rounded-2xl">
          <h1 className="text-3xl font-bold text-center">Complete Volunteer Profile</h1>

          {error && <div className="mt-4 text-sm text-red-700 bg-red-50 border p-3 rounded">{error}</div>}
          {success && <div className="mt-4 text-sm text-green-700 bg-green-50 border p-3 rounded">{success}</div>}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">

            {/* Phone */}
            <input
              type="text"
              placeholder="Phone Number"
              className="input w-full"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
            />

            {/* Province */}
            <Select
              options={provinceOptions}
              placeholder="Select Province"
              value={selectedProvince}
              onChange={(prov) => {
                setSelectedProvince(prov);
                setForm({ ...form, province: prov.value, city: "" });
              }}
            />

            {/* City */}
            <Select
              options={cityOptions}
              placeholder="Select City"
              value={cityOptions.find(c => c.value === form.city) || null}
              isDisabled={!selectedProvince}
              onChange={(city) => setForm({ ...form, city: city.value })}
            />

            {/* Volunteer Type */}
            <select
              className="input w-full"
              value={form.organizationType}
              onChange={(e) =>
                setForm({ ...form, organizationType: e.target.value, organization: "" })
              }
              required
            >
              <option value="">Select Volunteer Type</option>
              <option value="rescue">Rescue Organization</option>
              <option value="ngo">NGO</option>
            </select>

            {/* Organization */}
            {form.organizationType === "rescue" && (
              <Select
                options={rescueOrgs}
                placeholder="Select Rescue Organization"
                value={rescueOrgs.find(o => o.value === form.organization) || null}
                onChange={(org) => setForm({ ...form, organization: org.value })}
              />
            )}
            {form.organizationType === "ngo" && (
              <Select
                options={ngoOrgs}
                placeholder="Select NGO"
                value={ngoOrgs.find(o => o.value === form.organization) || null}
                onChange={(org) => setForm({ ...form, organization: org.value })}
              />
            )}

            {/* Skills */}
            <Select
              options={skillsOptions}
              isMulti
              placeholder="Select Your Skills"
              value={form.skills}
              onChange={(skills) => setForm({ ...form, skills })}
            />

            {/* Availability */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.available}
                onChange={(e) => setForm({ ...form, available: e.target.checked })}
                id="available"
              />
              <label htmlFor="available" className="text-sm font-medium">
                Available for tasks
              </label>
            </div>

            <button className="btn-primary w-full">Save Profile</button>
          </form>
        </div>
      </div>
    </div>
  );
}
