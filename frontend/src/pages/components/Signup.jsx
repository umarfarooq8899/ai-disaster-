// src/pages/components/Signup.jsx
import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

export default function Signup() {
  const navigate = useNavigate();
  const { signupUser } = useContext(AuthContext);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "general", // default role
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Make sure no one can signup as admin
    if (form.role === "admin") {
      return setError("You cannot register as an admin.");
    }

    const res = await signupUser(form);
    if (!res.success) return setError(res.message);

    setSuccess("Account created successfully! Redirecting to login...");
    setTimeout(() => navigate("/login"), 1500);
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="card p-8">
        <h1 className="text-3xl font-bold">Sign Up</h1>
        {error && <p className="text-red-600 mt-2">{error}</p>}
        {success && <p className="text-green-600 mt-2">{success}</p>}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            required
            onChange={handleChange}
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            required
            onChange={handleChange}
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            required
            onChange={handleChange}
          />

          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          >
            {/* Admin option removed */}
            <option value="general">General User</option>
            <option value="volunteer">Volunteer</option>
            <option value="ngo">NGO</option>
            <option value="rescue">Rescue</option>
          </select>

          <button className="btn-primary w-full" type="submit">
            Sign Up
          </button>
        </form>

        <p className="mt-4 text-sm">
          Already have an account? <Link to="/login" className="text-blue-600">Login</Link>
        </p>
      </div>
    </div>
  );
}
