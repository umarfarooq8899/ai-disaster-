import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { createDisaster } from "../../api/disasters";
import { FaImage, FaMapMarkerAlt } from "react-icons/fa";

export default function ReportDisaster() {
  const { user, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login", {
        state: { message: "Please sign up or login to report a disaster." },
      });
    }
  }, [user, loading, navigate]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    severity: "moderate",
    image: null,
  });

  const [status, setStatus] = useState({
    loading: false,
    error: "",
    ok: "",
  });

  const handleChange = (e) =>
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  const handleFileChange = (e) =>
    setForm((s) => ({ ...s, image: e.target.files[0] }));

  const submit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: "", ok: "" });

    try {
      const data = new FormData();
      data.append("title", form.title);
      data.append("description", form.description);
      data.append("location", form.location);
      data.append("severity", form.severity);
      if (form.image) data.append("image", form.image);

      await createDisaster(data);
      setStatus({ loading: false, error: "", ok: "Report submitted successfully!" });
      setForm({ title: "", description: "", location: "", severity: "moderate", image: null });
    } catch (err) {
      setStatus({
        loading: false,
        error: err?.response?.data?.message || "Failed to submit report",
        ok: "",
      });
    }
  };

  if (loading) return <div className="flex justify-center py-20 text-gray-500">Checking authentication...</div>;
  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white shadow-xl rounded-xl p-8">
        <h1 className="text-3xl font-extrabold text-gray-800 mb-6">Report a Disaster</h1>

        {/* Error / Success Messages */}
        {status.error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {status.error}
          </div>
        )}
        {status.ok && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {status.ok}
          </div>
        )}

        {/* Form */}
        <form onSubmit={submit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">Title</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Enter disaster title"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Describe the disaster in detail"
              required
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">Location</label>
            <div className="relative">
              <FaMapMarkerAlt className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                name="location"
                value={form.location}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg pl-10 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Enter location"
                required
              />
            </div>
          </div>

          {/* Severity */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">Severity</label>
            <select
              name="severity"
              value={form.severity}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="safe">Safe</option>
              <option value="moderate">Moderate</option>
              <option value="danger">Danger</option>
            </select>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">Upload Image</label>
            <label className="flex items-center gap-3 cursor-pointer border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50">
              <FaImage className="text-gray-500" />
              {form.image ? form.image.name : "Choose an image"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={status.loading}
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {status.loading ? "Submitting..." : "Submit Report"}
          </button>
        </form>
      </div>
    </div>
  );
}
