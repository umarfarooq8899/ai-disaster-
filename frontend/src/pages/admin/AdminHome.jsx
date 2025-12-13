import React from 'react'
export default function AdminHome(){
  return (
    <div>
      <h2 className="text-xl font-semibold">Admin Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div className="bg-white p-4 rounded shadow">Manage Users</div>
        <div className="bg-white p-4 rounded shadow">Manage Zones</div>
        <div className="bg-white p-4 rounded shadow">AI Predictions</div>
      </div>
    </div>
  )
}
