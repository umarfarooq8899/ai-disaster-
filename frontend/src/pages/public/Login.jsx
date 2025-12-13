import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { loginUser } = useContext(AuthContext);

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const res = await loginUser(form);
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
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Login</h1>
        <p className="mt-1 text-sm text-slate-600">Sign in to access your dashboard.</p>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Email</label>
            <input className="input" type="email" name="email" required onChange={handleChange} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Password</label>
            <input className="input" type="password" name="password" required onChange={handleChange} />
          </div>

          <button className="btn-primary w-full" type="submit">Login</button>
        </form>

        <p className="mt-5 text-sm text-slate-600">
          Don&apos;t have an account? <Link className="link font-semibold" to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
