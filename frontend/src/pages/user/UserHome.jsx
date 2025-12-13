import React, { useEffect, useState } from 'react'
import MapView from '../../components/map/MapView'
import { getAllDisasters } from '../../api/disasters'
import { zones, volunteers } from '../../utils/mockData'
import { Link } from 'react-router-dom'

export default function UserHome() {
  const [disasters, setDisasters] = useState([])
  useEffect(() => { getAllDisasters().then(setDisasters) }, [])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow">Alerts & quick actions</div>
        <div className="bg-white p-4 rounded shadow">My Profile</div>
        <div className="bg-white p-4 rounded shadow">Statistics</div>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Live Map</h3>
        <MapView disasters={disasters} zones={zones} volunteers={volunteers} />
      </div>

      <div className="flex gap-3">
        <Link to="/dashboard/user/reports" className="px-4 py-2 bg-blue-600 text-white rounded">My Reports</Link>
        <Link to="/report" className="px-4 py-2 border rounded">Report Disaster</Link>
      </div>
    </div>
  )
}
