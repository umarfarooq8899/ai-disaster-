import React from "react";

export default function Coordination() {
  return (
    <div className="grid gap-8">
      {/* Header */}
      <section className="card p-8">
        <h1 className="text-3xl font-extrabold text-slate-900">
          Disaster Coordination
        </h1>
        <p className="mt-2 text-slate-600">
          Role-based coordination between authorities, NGOs, volunteers, and rescue teams.
        </p>
      </section>

      {/* Role Flow */}
      <section className="grid gap-6 md:grid-cols-2">
        <div className="card p-6">
          <h3 className="text-lg font-extrabold text-slate-900">
            👤 Public Users
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Citizens report disasters and view alerts in real time.
          </p>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-extrabold text-slate-900">
            🧑‍💼 Admin
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Admin verifies disaster reports and controls system access.
          </p>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-extrabold text-slate-900">
            🏥 NGO
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            NGOs assign volunteers and manage resources for relief operations.
          </p>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-extrabold text-slate-900">
            🚑 Rescue Teams
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Rescue teams respond on ground based on assigned tasks.
          </p>
        </div>
      </section>

      {/* Summary */}
      <section className="card p-8">
        <h2 className="text-xl font-extrabold text-slate-900">
          Why Coordination Matters
        </h2>
        <p className="mt-3 text-slate-600 leading-relaxed">
          Efficient coordination ensures faster response, reduced confusion,
          and better disaster management. This system centralizes communication
          and task distribution.
        </p>
      </section>
    </div>
  );
}
