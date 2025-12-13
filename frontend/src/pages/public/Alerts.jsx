import React, { useEffect, useState } from "react";
import { getAllDisasters } from "../../api/disasters";

const badge = (severity) => {
  const map = {
    danger: "bg-red-50 text-red-700 border-red-200",
    moderate: "bg-orange-50 text-orange-700 border-orange-200",
    safe: "bg-green-50 text-green-800 border-green-200",
  };
  return map[severity] || "bg-slate-50 text-slate-700 border-slate-200";
};

export default function Alerts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllDisasters()
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="card p-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Alerts</h1>
            <p className="mt-1 text-sm text-slate-600">Latest disaster reports submitted by users.</p>
          </div>
          <div className="text-sm text-slate-600">{items.length} total</div>
        </div>

        {loading ? (
          <div className="mt-6 text-sm text-slate-600">Loading…</div>
        ) : items.length === 0 ? (
          <div className="mt-6 rounded-xl border border-brand-100 bg-white p-4 text-sm text-slate-600">
            No alerts yet.
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {items.map((d) => (
              <div key={d._id} className="rounded-2xl border border-brand-100 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-lg font-extrabold text-slate-900">{d.title}</div>
                  <span className={"rounded-full border px-3 py-1 text-xs font-bold " + badge(d.severity)}>
                    {String(d.severity).toUpperCase()}
                  </span>
                </div>
                <div className="mt-2 text-sm text-slate-600">{d.description}</div>
                <div className="mt-3 text-xs text-slate-500">
                  Location: <span className="font-semibold">{d.location}</span> •{" "}
                  {d.createdAt ? new Date(d.createdAt).toLocaleString() : ""}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
