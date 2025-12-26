import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { createDisaster } from "../../api/disasters";

export default function ReportDisaster() {
  const { user, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  // Redirect ONLY after auth finishes loading
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login", {
        state: {
          message: "Please sign up or login to report a disaster.",
        },
      });
    }
  }, [user, loading, navigate]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    severity: "moderate",
  });

  const [status, setStatus] = useState({
    loading: false,
    error: "",
    ok: "",
  });

  const handleChange = (e) =>
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: "", ok: "" });

    try {
      await createDisaster(form);
      setStatus({
        loading: false,
        error: "",
        ok: "Report submitted successfully!",
      });
      setForm({
        title: "",
        description: "",
        location: "",
        severity: "moderate",
      });
    } catch (err) {
      setStatus({
        loading: false,
        error: err?.response?.data?.message || "Failed to submit report",
        ok: "",
      });
    }
  };

  // While checking auth
  if (loading) {
    return (
      <div className="flex justify-center py-20 text-gray-500">
        Checking authentication...
      </div>
    );
  }

  // If redirected
  if (!user) return null;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="card p-8">
        <h1 className="text-3xl font-extrabold tracking-tight">
          Report a Disaster
        </h1>

        {status.error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {status.error}
          </div>
        )}

        {status.ok && (
          <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {status.ok}
          </div>
        )}

        <form onSubmit={submit} className="mt-6 grid gap-4">
          <input
            className="input"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Title"
            required
          />

          <textarea
            className="input min-h-[120px]"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Description"
            required
          />

          <input
            className="input"
            name="location"
            value={form.location}
            onChange={handleChange}
            placeholder="Location"
            required
          />

          <select
            className="input"
            name="severity"
            value={form.severity}
            onChange={handleChange}
          >
            <option value="safe">Safe</option>
            <option value="moderate">Moderate</option>
            <option value="danger">Danger</option>
          </select>

          <button
            className="btn-primary"
            disabled={status.loading}
            type="submit"
          >
            {status.loading ? "Submitting..." : "Submit Report"}
          </button>
        </form>
      </div>
    </div>
  );
}

