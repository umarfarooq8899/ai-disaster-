import React from "react";
import MapView from "../../components/map/MapView";
import { disasters, volunteers as vol } from "../../utils/mockData";

export default function NearbyReports() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Heading */}
      <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center md:text-left">
        Nearby Reports
      </h2>

      {/* Map container */}
      <div className="w-full h-[400px] md:h-[600px] rounded-2xl overflow-hidden shadow-lg">
        <MapView disasters={disasters} volunteers={vol} />
      </div>
    </div>
  );
}
