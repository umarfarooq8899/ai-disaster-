import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { createDisaster } from "../../api/disasters";

export default function ReportDisaster() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: "", description: "", location: "", severity: "moderate" });
  const [status, setStatus] = useState({ loading: false, error: "", ok: "" });

  const handleChange = (e) => setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: "", ok: "" });

    if (!user) {
      setStatus({ loading: false, error: "Please login first to submit a report.", ok: "" });
      return navigate("/login");
    }

    try {
      await createDisaster(form);
      setStatus({ loading: false, error: "", ok: "Report submitted successfully!" });
      setForm({ title: "", description: "", location: "", severity: "moderate" });
    } catch (err) {
      setStatus({
        loading: false,
        error: err?.response?.data?.message || "Failed to submit report",
        ok: "",
      });
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="card p-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Report a Disaster</h1>
        <p className="mt-1 text-sm text-slate-600">
          Submit a verified report. Your account will be attached to this report.
        </p>

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
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Title</label>
            <input className="input" name="title" value={form.title} onChange={handleChange} required />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Description</label>
            <textarea
              className="input min-h-[120px]"
              name="description"
              value={form.description}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Location</label>
              <input className="input" name="location" value={form.location} onChange={handleChange} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Severity</label>
              <select className="input" name="severity" value={form.severity} onChange={handleChange}>
                <option value="safe">Safe</option>
                <option value="moderate">Moderate</option>
                <option value="danger">Danger</option>
              </select>
            </div>
          </div>

          <button className="btn-primary w-full sm:w-fit" disabled={status.loading} type="submit">
            {status.loading ? "Submitting..." : "Submit Report"}
          </button>
        </form>
      </div>
    </div>
  );
}
