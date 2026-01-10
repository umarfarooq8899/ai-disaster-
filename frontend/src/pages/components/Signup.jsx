// src/pages/components/Signup.jsx
import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

export default function Signup() {
  const navigate = useNavigate();
  const { signupUser } = useContext(AuthContext);

  // Predefined Rescue Organizations
  const rescueOrgs = [
    "Rescue 1122",
    "Edhi Foundation",
    "Al-Khidmat Foundation",
    "Pakistan Red Crescent",
  ];

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "general",
    phone: "",
    address: "",
    organization: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Prevent admin registration
    if (form.role === "admin") {
      return setError("You cannot register as an admin.");
    }

    // Validate volunteers
    if (form.role === "volunteer") {
      if (!form.phone || !form.address) {
        return setError("Phone number and address are required for volunteers.");
      }
      if (!form.organization) {
        return setError("Please select a rescue organization to volunteer for.");
      }
    }

    const res = await signupUser(form);
    if (!res.success) return setError(res.message);

    setSuccess("Account created successfully! Redirecting to login...");
    setTimeout(() => navigate("/login"), 1500);
  };

  return (
    <div className="min-h-screen flex justify-center items-start bg-gray-50 px-4 py-12">
      <div className="sticky top-20 w-full max-w-md">
        <div className="card p-8 bg-white border border-gray-200 shadow-md rounded-2xl">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Sign Up
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Create an account to access your dashboard
          </p>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                required
                value={form.name}
                onChange={handleChange}
                className="input w-full"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Email
              </label>
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                className="input w-full"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Password
              </label>
              <input
                type="password"
                name="password"
                required
                value={form.password}
                onChange={handleChange}
                className="input w-full"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Role
              </label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="input w-full"
              >
                <option value="general">General User</option>
                <option value="volunteer">Volunteer</option>
              </select>
            </div>

            {/* Volunteer-specific fields */}
            {form.role === "volunteer" && (
              <>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    name="phone"
                    required
                    value={form.phone}
                    onChange={handleChange}
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    required
                    value={form.address}
                    onChange={handleChange}
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Select Rescue Organization
                  </label>
                  <select
                    name="organization"
                    value={form.organization}
                    onChange={handleChange}
                    className="input w-full"
                    required
                  >
                    <option value="">Select an organization</option>
                    {rescueOrgs.map((org, idx) => (
                      <option key={idx} value={org}>
                        {org}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <button type="submit" className="btn-primary w-full">
              Sign Up
            </button>
          </form>

          <p className="mt-5 text-sm text-slate-600">
            Already have an account?{" "}
            <Link className="link font-semibold text-blue-600" to="/login">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
