import React from 'react'
import MapView from '../../components/map/MapView'
import { zones } from '../../utils/mockData'

export default function SafeZones() {
  const safe = zones.filter(z => z.level === 'safe')
  return (
    <div>
      <h2 className="text-xl font-semibold">Safe Zones</h2>
      <div className="mt-3">
        <MapView zones={safe} disasters={[]} volunteers={[]} height="420px" />
      </div>
    </div>
  )
}
