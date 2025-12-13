import React from 'react'
import MapView from '../../components/map/MapView'
import { disasters, volunteers as vol } from '../../utils/mockData'
export default function NearbyReports(){
  return (
    <div>
      <h2 className="text-xl font-semibold">Nearby Reports</h2>
      <MapView disasters={disasters} volunteers={vol} />
    </div>
  )
}
