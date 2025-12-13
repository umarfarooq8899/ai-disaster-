export const disasters = [
  {
    id: 1,
    type: 'Flood',
    description: 'Severe flooding in district A',
    location: { lat: 24.8607, lng: 67.0011 },
    severity: 'danger'
  },
  {
    id: 2,
    type: 'Fire',
    description: 'Forest fire near town B',
    location: { lat: 24.9, lng: 67.05 },
    severity: 'moderate'
  }
]

export const zones = [
  { id: 1, name: 'Zone A', polygon: [[24.86,67.00],[24.87,67.01],[24.865,67.02]], level: 'danger' },
  { id: 2, name: 'Safe Shelter 1', polygon: [[24.855,67.02],[24.85,67.023],[24.851,67.027]], level: 'safe' }
]

export const volunteers = [
  { id: 1, name: 'Ali', location: { lat: 24.86, lng: 67.02 }, skills: ['first-aid'] }
]

export const notifications = [
  { id: 1, title: 'Flood Alert', body: 'Severe flood expected in Zone A', date: new Date().toISOString() }
]
