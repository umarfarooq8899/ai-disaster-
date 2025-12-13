import React from 'react'
import { getAllDisasters } from '../../api/disasters'
import { useEffect, useState } from 'react'

export default function MyReports() {
  const [reports, setReports] = useState([])
  useEffect(() => { getAllDisasters().then(setReports) }, [])

  return (
    <div>
      <h2 className="text-xl font-semibold">My Reports</h2>
      <div className="mt-3 space-y-2">
        {reports.map(r => (
          <div key={r.id} className="bg-white p-3 rounded shadow">
            <div className="font-bold">{r.type}</div>
            <div className="text-sm text-gray-600">{r.description}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
