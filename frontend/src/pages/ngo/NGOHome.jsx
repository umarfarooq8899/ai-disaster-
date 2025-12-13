import React from 'react'
export default function NGOHome(){
  return (
    <div>
      <h2 className="text-xl font-semibold">NGO Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div className="bg-white p-4 rounded shadow">Manage Volunteers</div>
        <div className="bg-white p-4 rounded shadow">Resource Distribution</div>
        <div className="bg-white p-4 rounded shadow">Aid Requests</div>
      </div>
    </div>
  )
}
