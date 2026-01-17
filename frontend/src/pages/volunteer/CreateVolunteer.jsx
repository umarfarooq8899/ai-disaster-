import React, { useContext, useState, useEffect } from "react";
import Select from "react-select";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import axiosInstance from "../../api/axios";

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
  const [orgs, setOrgs] = useState([]);

  const [form, setForm] = useState({
    phone: "",
    province: "",
    city: "",
    organizationType: "",
    organization: "",
    skills: [],
    available: true,
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch organizations based on type
  useEffect(() => {
    if (!form.organizationType) {
      setOrgs([]);
      return;
    }

    async function fetchOrgs() {
      try {
        const type = form.organizationType === "RescueOrganization" ? "rescue" : "ngo";
        const res = await axiosInstance.get(`/organizations/${type}`);
        setOrgs(res.data.map(o => ({ value: o._id, label: o.name })));
      } catch (err) {
        console.error("Failed to fetch organizations", err);
      }
    }
    fetchOrgs();
  }, [form.organizationType]);

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

        if (res?.success && res.volunteer) {
          const profile = res.volunteer;
          setForm({
            ...profile,
            skills: (profile.skills || []).map((s) => ({
              value: s,
              label: s,
            })),
          });

          if (profile.province) {
            setSelectedProvince({
              value: profile.province,
              label: profile.province,
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

    setSuccess("Volunteer profile saved successfully!");
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

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="text"
              placeholder="+92 3XX XXXXXXX"
              className="input w-full"
              value={form.phone}
              onChange={(e) =>
                setForm({ ...form, phone: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Province
            </label>
            <Select
              options={provinceOptions}
              placeholder="Select Province"
              value={selectedProvince}
              onChange={(p) => {
                setSelectedProvince(p);
                setForm({ ...form, province: p.value, city: "" });
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              City
            </label>
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
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Organization Type
            </label>
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
              <option value="RescueOrganization">Rescue Organization</option>
              <option value="NgoOrganization">NGO</option>
            </select>
          </div>

          {form.organizationType && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Organization
              </label>
              <Select
                options={orgs}
                placeholder={`Select ${form.organizationType === "RescueOrganization" ? "Rescue" : "NGO"}`}
                value={
                  orgs.find(
                    (o) => o.value === form.organization
                  ) || null
                }
                onChange={(o) =>
                  setForm({ ...form, organization: o.value })
                }
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Your Skills
            </label>
            <Select
              isMulti
              options={skillsOptions}
              placeholder="Select Skills"
              value={form.skills}
              onChange={(skills) =>
                setForm({ ...form, skills })
              }
            />
          </div>

          <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
            <input
              type="checkbox"
              id="available-check"
              className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
              checked={form.available}
              onChange={(e) =>
                setForm({ ...form, available: e.target.checked })
              }
            />
            <label htmlFor="available-check" className="text-sm font-semibold text-gray-700 cursor-pointer">
              I am available for active tasks
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
