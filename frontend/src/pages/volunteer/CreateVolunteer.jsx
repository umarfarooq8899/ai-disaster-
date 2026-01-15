import React, { useContext, useState, useEffect } from "react";
import Select from "react-select";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

// Rescue organizations
const rescueOrgs = [
  { value: "Rescue 1122", label: "Rescue 1122" },
  { value: "Edhi Foundation", label: "Edhi Foundation" },
  { value: "Al-Khidmat Foundation", label: "Al-Khidmat Foundation" },
  { value: "Pakistan Red Crescent", label: "Pakistan Red Crescent" },
];

// NGOs
const ngoOrgs = [
  { value: "Edhi Foundation", label: "Edhi Foundation" },
  { value: "Al-Khidmat Foundation", label: "Al-Khidmat Foundation" },
  { value: "Saylani Welfare", label: "Saylani Welfare" },
  { value: "Aman Foundation", label: "Aman Foundation" },
];

// Provinces & cities
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

export default function CreateVolunteer() {
  const navigate = useNavigate();
  const {
    user,
    createVolunteerProfile,
    getDashboardPath,
    getVolunteerProfile,
  } = useContext(AuthContext);

  const provinceOptions = Object.keys(pakistanData).map((p) => ({
    value: p,
    label: p,
  }));

  const [selectedProvince, setSelectedProvince] = useState(null);
  const [loading, setLoading] = useState(false);

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

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  // Load existing profile (edit case)
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await getVolunteerProfile();

        if (res?.success && res.data) {
          setForm({
            ...res.data,
            skills: (res.data.skills || []).map((s) => ({
              value: s,
              label: s,
            })),
          });

          if (res.data.province) {
            setSelectedProvince({
              value: res.data.province,
              label: res.data.province,
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch volunteer profile", err);
      }
    }

    fetchProfile();
  }, [getVolunteerProfile]);

  const cityOptions = selectedProvince
    ? pakistanData[selectedProvince.value].map((c) => ({
        value: c,
        label: c,
      }))
    : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const { phone, province, city, organizationType, organization, skills } =
      form;

    if (
      !phone ||
      !province ||
      !city ||
      !organizationType ||
      !organization ||
      skills.length === 0
    ) {
      return setError("All fields are required.");
    }

    const phoneRegex = /^\+?\d{10,15}$/;
    if (!phoneRegex.test(phone)) {
      return setError("Invalid phone number.");
    }

    setLoading(true);

    const res = await createVolunteerProfile({
      ...form,
      skills: skills.map((s) => s.value),
    });

    setLoading(false);

    if (!res?.success) {
      return setError(res?.message || "Failed to save profile");
    }

    setSuccess("Volunteer profile created successfully!");
    setTimeout(() => {
      navigate(getDashboardPath("volunteer"));
    }, 1200);
  };

  return (
    <div className="min-h-screen flex justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow border">
        <h1 className="text-3xl font-bold text-center">
          Complete Volunteer Profile
        </h1>

        {error && (
          <div className="mt-4 text-sm text-red-700 bg-red-50 p-3 rounded border">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-4 text-sm text-green-700 bg-green-50 p-3 rounded border">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="text"
            placeholder="Phone Number"
            className="input w-full"
            value={form.phone}
            onChange={(e) =>
              setForm({ ...form, phone: e.target.value })
            }
          />

          <Select
            options={provinceOptions}
            placeholder="Select Province"
            value={selectedProvince}
            onChange={(p) => {
              setSelectedProvince(p);
              setForm({ ...form, province: p.value, city: "" });
            }}
          />

          <Select
            options={cityOptions}
            placeholder="Select City"
            isDisabled={!selectedProvince}
            value={
              cityOptions.find((c) => c.value === form.city) || null
            }
            onChange={(c) =>
              setForm({ ...form, city: c.value })
            }
          />

          <select
            className="input w-full"
            value={form.organizationType}
            onChange={(e) =>
              setForm({
                ...form,
                organizationType: e.target.value,
                organization: "",
              })
            }
          >
            <option value="">Select Volunteer Type</option>
            <option value="rescue">Rescue Organization</option>
            <option value="ngo">NGO</option>
          </select>

          {form.organizationType === "rescue" && (
            <Select
              options={rescueOrgs}
              placeholder="Select Rescue Organization"
              value={
                rescueOrgs.find(
                  (o) => o.value === form.organization
                ) || null
              }
              onChange={(o) =>
                setForm({ ...form, organization: o.value })
              }
            />
          )}

          {form.organizationType === "ngo" && (
            <Select
              options={ngoOrgs}
              placeholder="Select NGO"
              value={
                ngoOrgs.find(
                  (o) => o.value === form.organization
                ) || null
              }
              onChange={(o) =>
                setForm({ ...form, organization: o.value })
              }
            />
          )}

          <Select
            isMulti
            options={skillsOptions}
            placeholder="Select Skills"
            value={form.skills}
            onChange={(skills) =>
              setForm({ ...form, skills })
            }
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.available}
              onChange={(e) =>
                setForm({ ...form, available: e.target.checked })
              }
            />
            <label className="text-sm font-medium">
              Available for tasks
            </label>
          </div>

          <button
            className="btn-primary w-full"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}
