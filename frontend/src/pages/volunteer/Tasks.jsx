import React from 'react'
export default function Tasks(){
  return (
    <div>
      <h2 className="text-xl font-semibold">Tasks Assigned</h2>
      <div className="mt-3 space-y-2">
        <div className="bg-white p-3 rounded shadow">No active tasks currently</div>
      </div>
    </div>
  )
}
