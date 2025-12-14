import React from "react";

export default function AIPredictions() {
  return (
    <div className="grid gap-8">
      {/* Header */}
      <section className="card p-8">
        <h1 className="text-3xl font-extrabold text-slate-900">
          AI Disaster Predictions
        </h1>
        <p className="mt-2 text-slate-600">
          AI-based risk analysis using historical disaster patterns.
        </p>
      </section>

      {/* Prediction Cards */}
      <section className="grid gap-6 md:grid-cols-3">
        <div className="card p-6 border-l-4 border-red-500">
          <h3 className="text-lg font-extrabold text-slate-900">
            Flood Risk
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            High probability of flooding in coastal and low-lying areas.
          </p>
          <div className="mt-3 font-bold text-red-600">
            Risk Level: HIGH
          </div>
        </div>

        <div className="card p-6 border-l-4 border-yellow-500">
          <h3 className="text-lg font-extrabold text-slate-900">
            Earthquake Risk
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Moderate seismic activity detected based on recent patterns.
          </p>
          <div className="mt-3 font-bold text-yellow-600">
            Risk Level: MEDIUM
          </div>
        </div>

        <div className="card p-6 border-l-4 border-green-500">
          <h3 className="text-lg font-extrabold text-slate-900">
            Heatwave Risk
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Stable conditions with slight temperature rise predicted.
          </p>
          <div className="mt-3 font-bold text-green-600">
            Risk Level: LOW
          </div>
        </div>
      </section>

      {/* Explanation */}
      <section className="card p-8">
        <h2 className="text-xl font-extrabold text-slate-900">
          How AI Works Here
        </h2>
        <p className="mt-3 text-slate-600 leading-relaxed">
          This module simulates artificial intelligence by analyzing past
          disaster data and identifying patterns. In a real system, machine
          learning models such as decision trees or neural networks would be
          used to generate these predictions.
        </p>
      </section>
    </div>
  );
}
