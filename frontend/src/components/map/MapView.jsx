import React from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polygon } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
})

export default function MapView({ disasters = [], zones = [], volunteers = [], center = [24.86, 67.01], zoom = 12 }) {
  return (
    <div className="h-96 rounded-md overflow-hidden shadow">
      <MapContainer center={center} zoom={zoom} className="h-full w-full">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {disasters.map(d => (
          <Marker key={d.id} position={[d.location.lat, d.location.lng]}>
            <Popup>
              <div className="font-bold">{d.type}</div>
              <div>{d.description}</div>
            </Popup>
          </Marker>
        ))}

        {zones.map(z => {
          const positions = z.polygon.map(p => [p[0], p[1]])
          const color = z.level === 'danger' ? '#ef4444' : z.level === 'moderate' ? '#f97316' : '#10b981'
          return <Polygon key={z.id} positions={positions} pathOptions={{ color, fillOpacity: 0.2 }} />
        })}

        {volunteers.map(v => (
          <Marker key={v.id} position={[v.location.lat, v.location.lng]}>
            <Popup>{v.name}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
