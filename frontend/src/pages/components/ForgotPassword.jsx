import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // frontend-only for now
    setSubmitted(true);
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="card p-8">
        <h1 className="text-3xl font-extrabold tracking-tight">
          Forgot Password
        </h1>

        {!submitted ? (
          <>
            <p className="mt-2 text-sm text-slate-600">
              Enter your email and we’ll send reset instructions.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold">Email</label>
                <input
                  type="email"
                  required
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <button className="btn-primary w-full" type="submit">
                Send Reset Link
              </button>
            </form>
          </>
        ) : (
          <div className="mt-6 rounded-xl bg-green-50 p-4 text-sm text-green-700">
            If this email exists, reset instructions have been sent.
          </div>
        )}

        <p className="mt-5 text-sm">
          <Link to="/login" className="link font-semibold">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
