import React, { useEffect, useState } from "react";
import MapView from "../../components/map/MapView";
import { getAllDisasters } from "../../api/disasters";
import { Link } from "react-router-dom";

export default function Home() {
  const [disasters, setDisasters] = useState([]);

  useEffect(() => {
    getAllDisasters()
      .then(setDisasters)
      .catch(() => setDisasters([]));
  }, []);

  return (
    <div className="grid gap-8">
      {/* HERO SECTION */}
      <section className="card overflow-hidden">
        <div className="grid gap-8 p-8 md:grid-cols-2 md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
              Live Monitoring • AI-ready
            </div>

            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900">
              AI Disaster Relief System
            </h1>

            <p className="mt-3 text-slate-600">
              Report incidents, view alerts, coordinate volunteers and responders — with a clean blue & white UI.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/report" className="btn-primary">
                Report Disaster
              </Link>
              <Link to="/alerts" className="btn-outline">
                View Alerts
              </Link>
            </div>

            {/* STATS SUMMARY */}
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-brand-100 bg-white p-4">
                <div className="text-xs font-bold text-brand-700">Reports</div>
                <div className="mt-1 text-2xl font-extrabold">
                  {disasters.length}
                </div>
              </div>

              <div className="rounded-2xl border border-brand-100 bg-white p-4">
                <div className="text-xs font-bold text-brand-700">
                  High severity
                </div>
                <div className="mt-1 text-2xl font-extrabold">
                  {disasters.filter((d) => d.severity === "danger").length}
                </div>
              </div>

              <div className="rounded-2xl border border-brand-100 bg-white p-4">
                <div className="text-xs font-bold text-brand-700">
                  Volunteers
                </div>
                <div className="mt-1 text-2xl font-extrabold">—</div>
              </div>
            </div>
          </div>

          {/* MAP */}
          <div className="overflow-hidden rounded-2xl border border-brand-100 shadow-soft">
            <MapView disasters={disasters} />
          </div>
        </div>
      </section>

      {/* FEATURE CARDS */}
      <section className="grid gap-4 md:grid-cols-3">
        {/* STATISTICS */}
        <Link
          to="/statistics"
          className="card p-6 hover:shadow-lg transition cursor-pointer"
        >
          <h3 className="text-lg font-extrabold text-slate-900">
            Statistics
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            A quick view of reports and severity breakdown.
          </p>
        </Link>

        {/* AI PREDICTIONS */}
        <Link
          to="/ai-predictions"
          className="card p-6 hover:shadow-lg transition"
        >
          <h3 className="text-lg font-extrabold text-slate-900">
            AI Predictions
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Placeholder module for risk forecasting and trend detection.
          </p>
        </Link>

        {/* COORDINATION */}
        <Link
          to="/coordination"
          className="card p-6 hover:shadow-lg transition"
        >
          <h3 className="text-lg font-extrabold text-slate-900">
            Coordination
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Role dashboards: admin, NGO, rescue, volunteer, and users.
          </p>
        </Link>
      </section>
    </div>
  );
}
