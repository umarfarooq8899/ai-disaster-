import React from "react";
import { Link } from "react-router-dom";
import { Users, Activity, Bell, TrendingUp, TrendingDown } from "lucide-react";

export default function RescueHome() {
  // Example counts for indicators
  const stats = {
    missions: 12,
    newMissions: 3,
    activeAlerts: 5,
  };

  const cards = [
    {
      title: "Missions",
      description: "View all ongoing and completed missions.",
      icon: Activity,
      link: "/dashboard/rescue/missions",
      color: "blue",
      value: stats.missions,
      trend: "up",
    },
    {
      title: "Create Mission",
      description: "Add a new mission for your rescue team.",
      icon: Users,
      link: "/dashboard/rescue/missions/new",
      color: "green",
      value: stats.newMissions,
      trend: "up",
    },
    {
      title: "Dashboard",
      description: "View key metrics and active operations.",
      icon: Bell,
      link: "/dashboard/rescue/dashboard",
      color: "orange",
      value: stats.activeAlerts,
      trend: "down",
    },
  ];

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">
          Welcome to Rescue Operations
        </h1>
        <p className="text-gray-600 text-sm">
          Manage your rescue missions, volunteers, and alerts efficiently.
        </p>
      </header>

      {/* CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <Link
            to={card.link}
            key={card.title}
            className="group relative block bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-lg transition-transform transform hover:-translate-y-1"
          >
            {/* Accent bar */}
            <div
              className={`absolute left-0 top-0 h-full w-1 rounded-l-xl ${getColor(card.color).accent} transition-opacity`}
            />

            {/* Card content */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${getColor(card.color).bg}`}>
                  <card.icon className={`w-5 h-5 ${getColor(card.color).text}`} />
                </div>
                <p className="text-sm text-gray-800 font-medium">{card.title}</p>
              </div>

              {card.trend === "up" && (
                <TrendingUp className="w-5 h-5 text-green-500" />
              )}
              {card.trend === "down" && (
                <TrendingDown className="w-5 h-5 text-red-500" />
              )}
            </div>

            <p className="mt-4 text-gray-700">{card.description}</p>

            <p className="mt-4 text-2xl font-semibold text-gray-800">{card.value ?? 0}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ===============================
   COLOR UTILITY
================================ */
function getColor(color) {
  const colors = {
    blue: { bg: "bg-blue-50 text-blue-600", text: "text-blue-600", accent: "bg-blue-600" },
    green: { bg: "bg-green-50 text-green-600", text: "text-green-600", accent: "bg-green-600" },
    orange: { bg: "bg-orange-50 text-orange-600", text: "text-orange-600", accent: "bg-orange-600" },
  };
  return colors[color] || colors.blue;
}
