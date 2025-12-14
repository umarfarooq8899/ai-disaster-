import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";

export default function ResetPassword() {
  const { token } = useParams(); // for future backend use
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (form.password !== form.confirm) {
      return alert("Passwords do not match");
    }

    // frontend-only success
    setSuccess(true);
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="card p-8">
        <h1 className="text-3xl font-extrabold">Reset Password</h1>

        {!success ? (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold">
                New Password
              </label>
              <input
                type="password"
                required
                className="input"
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-semibold">
                Confirm Password
              </label>
              <input
                type="password"
                required
                className="input"
                onChange={(e) =>
                  setForm({ ...form, confirm: e.target.value })
                }
              />
            </div>

            <button className="btn-primary w-full">
              Reset Password
            </button>
          </form>
        ) : (
          <div className="mt-6 rounded-xl bg-green-50 p-4 text-sm text-green-700">
            Password reset successful.
            <div className="mt-2">
              <Link to="/login" className="link font-semibold">
                Go to login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
