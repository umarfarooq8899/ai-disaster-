import React from 'react'
export default function RescueHome(){
  return (
    <div>
      <h2 className="text-xl font-semibold">Rescue Team Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div className="bg-white p-4 rounded shadow">Monitor Disaster Zones</div>
        <div className="bg-white p-4 rounded shadow">Track volunteer activity</div>
        <div className="bg-white p-4 rounded shadow">Generate reports</div>
      </div>
    </div>
  )
}
