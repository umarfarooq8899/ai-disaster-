import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, Brain, Users, AlertTriangle } from "lucide-react";
import MapView from "../../components/map/MapView";
import { getAllDisasters } from "../../api/disasters";
import CountUp from "react-countup";

export default function Home() {
  const [disasters, setDisasters] = useState([]);
  const [loadingMap, setLoadingMap] = useState(true);
  const [loadingCards, setLoadingCards] = useState(true);

  useEffect(() => {
    getAllDisasters()
      .then((data) => {
        setDisasters(data);
        setTimeout(() => setLoadingMap(false), 600);
        setTimeout(() => setLoadingCards(false), 800);
      })
      .catch(() => {
        setDisasters([]);
        setLoadingMap(false);
        setLoadingCards(false);
      });
  }, []);

  // Example volunteers count (hardcoded here, could be dynamic)
  const volunteers = 120;

  return (
    <div className="grid gap-6">

      {/* HERO */}
      <section className="card overflow-hidden">
        <div className="grid gap-6 p-7 md:grid-cols-2 md:items-center">

          {/* LEFT */}
          <div>
            <h1 className="text-4xl font-extrabold">
              AI Disaster Relief System
            </h1>

            <p className="mt-2 text-slate-600 max-w-lg">
              Monitor disasters, view alerts, analyze statistics,
              and coordinate response efforts efficiently.
            </p>

            <div className="mt-4 flex gap-6 text-sm text-slate-500">
              <span>
                Active Disasters:{" "}
                <CountUp
                  end={disasters.length}
                  duration={1.5}
                  separator=","
                />
              </span>
              <span>
                Volunteers: <CountUp end={volunteers} duration={1.5} />
              </span>
            </div>

            <div className="mt-5 flex gap-3">
              <Link to="/report" className="btn-primary">
                Report Disaster
              </Link>
              <Link to="/alerts" className="btn-outline">
                View Alerts
              </Link>
            </div>
          </div>

          {/* MAP WITH LEGEND AND SKELETON */}
          <div className="rounded-2xl overflow-hidden border relative">
            {loadingMap ? (
              <div className="h-[320px] animate-pulse bg-slate-100 flex items-center justify-center text-slate-400">
                Loading map…
              </div>
            ) : (
              <MapView disasters={disasters} />
            )}

            {/* MAP LEGEND */}
            {!loadingMap && (
              <div className="absolute bottom-4 left-4 bg-white/90 px-3 py-2 rounded-lg text-sm shadow-md">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="text-red-600" />
                  <span>Active Disaster</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Users className="text-blue-600" />
                  <span>Volunteer</span>
                </div>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* FEATURE CARDS */}
      <section className="grid gap-5 md:grid-cols-3">

        {loadingCards ? (
          // Skeleton Cards
          Array(3)
            .fill(0)
            .map((_, idx) => (
              <div
                key={idx}
                className="h-20 animate-pulse bg-slate-100 rounded-xl"
              ></div>
            ))
        ) : (
          <>
            {/* STATISTICS */}
            <FeatureCard
              to="/statistics"
              icon={<BarChart3 />}
              title="Statistics"
              badge="NEW"
              desc="Disaster trends and historical insights"
            />

            {/* AI PREDICTION */}
            <FeatureCard
              to="/ai-prediction"
              icon={<Brain />}
              title="AI Prediction"
              badge="AI"
              desc="AI-powered disaster forecasting"
            />

            {/* COORDINATION */}
            <FeatureCard
              to="/coordination"
              icon={<Users />}
              title="Coordination"
              desc="Volunteer and resource management"
            />
          </>
        )}

      </section>

      {/* FOOTER STRIP */}
      <footer className="text-center text-sm text-slate-400 py-2">
        © {new Date().getFullYear()} AI Disaster Relief System — All rights reserved
      </footer>
    </div>
  );
}

/* ===== FEATURE CARD COMPONENT ===== */
function FeatureCard({ to, icon, title, badge, desc }) {
  return (
    <Link
      to={to}
      className="card p-5 transition hover:-translate-y-1 hover:shadow-lg group relative"
    >
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl border group-hover:scale-105 transition">
          {icon}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold">{title}</h3>
            {badge && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100">
                {badge}
              </span>
            )}
          </div>
          <p className="mt-1 text-slate-600 text-sm">{desc}</p>
        </div>
      </div>
    </Link>
  );
}
