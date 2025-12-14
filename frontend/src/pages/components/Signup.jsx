import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

export default function Signup() {
  const navigate = useNavigate();
  const { signupUser } = useContext(AuthContext);

  const [form, setForm] = useState({ name: "", email: "", password: "", role: "general" });
  const [error, setError] = useState("");

  const handleChange = (e) => setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // IMPORTANT: In real apps, you wouldn't allow users to self-select admin.
    const res = await signupUser(form);
    if (!res.success) return setError(res.message);

    const role = res.data.user.role;
    const map = {
      general: "/dashboard/user",
      volunteer: "/dashboard/volunteer",
      ngo: "/dashboard/ngo",
      rescue: "/dashboard/rescue",
      admin: "/dashboard/admin",
    };
    navigate(map[role] || "/dashboard/user");
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="card p-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Create account</h1>
        <p className="mt-1 text-sm text-slate-600">Blue & white themed portal for disaster reporting.</p>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Name</label>
            <input className="input" name="name" required onChange={handleChange} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Email</label>
            <input className="input" type="email" name="email" required onChange={handleChange} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Password</label>
            <input className="input" type="password" name="password" required onChange={handleChange} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Role</label>
            <select className="input" name="role" onChange={handleChange} defaultValue="general">
              <option value="general">General User</option>
              <option value="volunteer">Volunteer</option>
              <option value="ngo">NGO</option>
              <option value="rescue">Rescue Team</option>
              <option value="admin">Admin</option>
            </select>
            <p className="mt-2 text-xs text-slate-500">
              Demo project: role selection is enabled. In real apps, admin/provider roles are created by admins only.
            </p>
          </div>

          <button className="btn-primary w-full" type="submit">Sign up</button>
        </form>

        <p className="mt-5 text-sm text-slate-600">
          Already have an account? <Link className="link font-semibold" to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
