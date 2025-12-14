import React from "react";

export default function Statistics() {
  // Mock data (no backend)
  const stats = [
    { title: "Total Disasters", value: 128 },
    { title: "Active Disasters", value: 34 },
    { title: "Resolved Disasters", value: 94 },
    { title: "High Risk Areas", value: 12 },
  ];

  return (
    <div className="p-6">
      {/* Page Title */}
      <h1 className="text-3xl font-bold mb-2">
        Public Disaster Statistics
      </h1>

      <p className="text-gray-600 mb-6">
        Overview of disaster data (Demo data for academic submission)
      </p>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((item, index) => (
          <div
            key={index}
            className="bg-blue-100 p-4 rounded shadow"
          >
            <h2 className="text-lg font-semibold">
              {item.title}
            </h2>
            <p className="text-2xl font-bold mt-2">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* Info Note */}
      <div className="mt-6 text-sm text-gray-500">
        * This page displays mock statistics for demonstration purposes.
      </div>
    </div>
  );
}
