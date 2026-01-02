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
    role: "general", // Default must match your User.js enum
  });
  const [error, setError] = useState("");

  const handleChange = (e) =>
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Log the form data to your browser console to verify before sending
    console.log("Sending to backend:", form);

    const res = await signupUser(form);
    
    if (res.success) {
      // ✅ Success! Go to login
      navigate("/login");
    } else {
      // ❌ Error! Show the message from backend
      setError(res.message || "Signup failed. Check your connection.");
    }
  };

  return (
    <div className="mx-auto max-w-md mt-10">
      <div className="card p-8 shadow-lg border border-slate-200 rounded-2xl bg-white">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Create account
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Blue & white themed portal for disaster reporting.
        </p>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 animate-pulse">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Name</label>
            <input 
              className="input w-full p-2 border rounded" 
              name="name" 
              placeholder="John Doe"
              required 
              onChange={handleChange} 
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Email</label>
            <input
              className="input w-full p-2 border rounded"
              type="email"
              name="email"
              placeholder="admin@example.com"
              required
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Password</label>
            <input
              className="input w-full p-2 border rounded"
              type="password"
              name="password"
              placeholder="••••••••"
              required
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Role</label>
            <select
              className="input w-full p-2 border rounded bg-white"
              name="role"
              value={form.role} // Controlled component
              onChange={handleChange}
            >
              <option value="general">General User</option>
              <option value="volunteer">Volunteer</option>
              <option value="ngo">NGO</option>
              <option value="rescue">Rescue Team</option>
              <option value="admin">Admin</option>
            </select>
            <p className="mt-2 text-xs text-slate-500 italic">
              * In this demo, you can select "Admin" to access the dashboard immediately.
            </p>
          </div>

          <button className="btn-primary w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition" type="submit">
            Sign up
          </button>
        </form>

        <p className="mt-5 text-sm text-slate-600 text-center">
          Already have an account?{" "}
          <Link className="text-blue-600 font-semibold hover:underline" to="/login">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}