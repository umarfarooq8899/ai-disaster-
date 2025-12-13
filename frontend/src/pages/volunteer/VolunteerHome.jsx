import React from 'react'
export default function VolunteerHome(){
  return (
    <div>
      <h2 className="text-xl font-semibold">Volunteer Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="bg-white p-4 rounded shadow">Assigned tasks</div>
        <div className="bg-white p-4 rounded shadow">Nearby alerts</div>
      </div>
    </div>
  )
}
