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

      {/* HERO */}
      <section className="card overflow-hidden">
        <div className="grid gap-8 p-8 md:grid-cols-2 md:items-center">
          <div>
            <h1 className="text-4xl font-extrabold">
              AI Disaster Relief System
            </h1>

            <p className="mt-3 text-slate-600">
              Monitor disasters, view alerts and manage your profile.
            </p>

            <div className="mt-6 flex gap-3">
              <Link to="/report disaster" className="btn-primary">
                Report Disaster
              </Link>
              <Link to="/alerts" className="btn-outline">
                View Alerts
              </Link>
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden border">
            <MapView disasters={disasters} />
          </div>
        </div>
      </section>

    
    </div>
  );
}

