import React, { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Link } from 'react-router-dom'

// Fix default marker icons (Leaflet + bundlers quirk)
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const brandIcon = new L.DivIcon({
  html: `<div style="background:#158459;width:16px;height:16px;border-radius:9999px;border:3px solid white;box-shadow:0 1px 6px rgba(0,0,0,.4)"></div>`,
  className: '',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

function FitBounds({ points }) {
  const map = useMap()
  useEffect(() => {
    if (points.length === 0) return
    if (points.length === 1) {
      map.setView(points[0], 12)
    } else {
      map.fitBounds(points, { padding: [40, 40] })
    }
  }, [points.length])
  return null
}

export default function ProjectsMap({ projects, height = 420 }) {
  // Project coordinates are persisted as location.coordinates.coordinates: [lng, lat].
  const getPoint = (project) => {
    const coordinates = project?.location?.coordinates?.coordinates
    if (!Array.isArray(coordinates) || coordinates.length !== 2) return null
    const [lng, lat] = coordinates
    return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null
  }

  const mappedProjects = (Array.isArray(projects) ? projects : [])
    .map((project) => ({
      project: {
        ...project,
        location: typeof project?.location === 'string'
          ? project.location
          : project?.location?.city || project?.location?.address || 'Location unavailable',
      },
      point: getPoint(project),
    }))
    .filter(({ point }) => point)
  const points = mappedProjects.map(({ point }) => point)

  const center = points[0] || [33.6007, 73.0679] // Rawalpindi fallback

  return (
    <div className="card overflow-hidden" style={{ height }}>
      <MapContainer center={center} zoom={mappedProjects.length ? 11 : 12} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {mappedProjects.length > 0 && <FitBounds points={points} />}
          {mappedProjects.map(({ project: p, point }, i) => (
            <Marker key={p._id || i} position={point} icon={brandIcon}>
              <Popup>
                <div className="space-y-1">
                  <p className="font-bold text-sm">{p.title}</p>
                  <p className="text-xs text-gray-500">{p.category} · {p.location}</p>
                  <Link to={`/projects/${p._id}`} className="text-xs font-semibold text-brand-700">View project →</Link>
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  )
}
