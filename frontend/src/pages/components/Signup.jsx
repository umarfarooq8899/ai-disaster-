import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Select from "react-select";
import { AuthContext } from "../../context/AuthContext";

export default function Signup() {
  const navigate = useNavigate();
  const { signupUser } = useContext(AuthContext);

  // Rescue Organizations
  const rescueOrgs = [
    { value: "Rescue 1122", label: "Rescue 1122" },
    { value: "Edhi Foundation", label: "Edhi Foundation" },
    { value: "Al-Khidmat Foundation", label: "Al-Khidmat Foundation" },
    { value: "Pakistan Red Crescent", label: "Pakistan Red Crescent" },
  ];

  // NGO Organizations
  const ngoOrgs = [
    { value: "Edhi Foundation", label: "Edhi Foundation" },
    { value: "Al-Khidmat Foundation", label: "Al-Khidmat Foundation" },
    { value: "Saylani Welfare", label: "Saylani Welfare" },
    { value: "Aman Foundation", label: "Aman Foundation" },
  ];

  // Pakistan Provinces & Cities
  const pakistanData = {
    Punjab: [
      "Lahore","Rawalpindi","Islamabad","Faisalabad","Multan","Gujranwala",
      "Sialkot","Sargodha","Bahawalpur","Rahim Yar Khan","Kasur","Okara",
      "Sheikhupura","Jhelum","Attock","Chakwal","Mandi Bahauddin","Hafizabad",
      "Vehari","Layyah","Bhakkar","Toba Tek Singh"
    ],
    Sindh: [
      "Karachi","Hyderabad","Sukkur","Larkana","Nawabshah","Mirpurkhas",
      "Thatta","Badin","Jacobabad","Khairpur","Shikarpur","Umerkot",
      "Dadu","Ghotki","Tando Adam","Tando Allahyar"
    ],
    KPK: [
      "Peshawar","Mardan","Abbottabad","Swat","Mingora","Mansehra",
      "Charsadda","Nowshera","Kohat","Bannu","Dera Ismail Khan",
      "Swabi","Haripur","Lower Dir","Upper Dir","Batkhela"
    ],
    Balochistan: [
      "Quetta","Gwadar","Turbat","Khuzdar","Chaman","Zhob",
      "Sibi","Loralai","Panjgur","Awaran","Kalat","Mastung"
    ],
    Islamabad: ["Islamabad"],
    "Gilgit-Baltistan": [
      "Gilgit","Skardu","Hunza","Ghizer","Diamer","Astore"
    ],
    AJK: [
      "Muzaffarabad","Mirpur","Kotli","Bhimber","Bagh","Rawalakot"
    ],
  };

  const provinceOptions = Object.keys(pakistanData).map((prov) => ({
    value: prov,
    label: prov,
  }));

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "general",
    phone: "",
    province: "",
    city: "",
    organizationType: "",
    organization: "",
  });

  const [selectedProvince, setSelectedProvince] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const cityOptions = selectedProvince
    ? pakistanData[selectedProvince.value].map((city) => ({
        value: city,
        label: city,
      }))
    : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.role === "volunteer") {
      if (!form.phone || !form.province || !form.city) {
        return setError("Phone, province and city are required for volunteers.");
      }
      if (!form.organizationType) {
        return setError("Please select volunteer type.");
      }
      if (!form.organization) {
        return setError("Please select an organization.");
      }
    }

    const res = await signupUser(form);
    if (!res.success) return setError(res.message);

    setSuccess("Account created successfully! Redirecting to login...");
    setTimeout(() => navigate("/login"), 1500);
  };

  return (
    <div className="min-h-screen flex justify-center items-start bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="p-8 bg-white border shadow-md rounded-2xl">
          <h1 className="text-3xl font-bold text-center">Sign Up</h1>

          {error && (
            <div className="mt-4 text-sm text-red-700 bg-red-50 border p-3 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-4 text-sm text-green-700 bg-green-50 border p-3 rounded">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <input
              className="input w-full"
              placeholder="Full Name"
              required
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <input
              type="email"
              className="input w-full"
              placeholder="Email"
              required
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            <input
              type="password"
              className="input w-full"
              placeholder="Password"
              required
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />

            <select
              className="input w-full"
              value={form.role}
              onChange={(e) =>
                setForm({
                  ...form,
                  role: e.target.value,
                  organizationType: "",
                  organization: "",
                })
              }
            >
              <option value="general">General User</option>
              <option value="volunteer">Volunteer</option>
            </select>

            {form.role === "volunteer" && (
              <>
                <input
                  className="input w-full"
                  placeholder="Phone Number"
                  onChange={(e) =>
                    setForm({ ...form, phone: e.target.value })
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

                <Select
                  options={provinceOptions}
                  placeholder="Select Province"
                  onChange={(prov) => {
                    setSelectedProvince(prov);
                    setForm({ ...form, province: prov.value, city: "" });
                  }}
                />

                <Select
                  options={cityOptions}
                  placeholder="Select City"
                  isDisabled={!selectedProvince}
                  onChange={(city) =>
                    setForm({ ...form, city: city.value })
                  }
                />

                {form.organizationType === "rescue" && (
                  <Select
                    options={rescueOrgs}
                    placeholder="Select Rescue Organization"
                    onChange={(org) =>
                      setForm({ ...form, organization: org.value })
                    }
                  />
                )}

                {form.organizationType === "ngo" && (
                  <Select
                    options={ngoOrgs}
                    placeholder="Select NGO"
                    onChange={(org) =>
                      setForm({ ...form, organization: org.value })
                    }
                  />
                )}
              </>
            )}

            <button className="btn-primary w-full">Sign Up</button>
          </form>

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
