import { useEffect } from 'react'
import { type LatLngTuple } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  CircleMarker,
  MapContainer,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
} from 'react-leaflet'
import { type OrderTracking } from '@/api/types'
import { formatDateTime } from '@/lib/format'
import { useLocalized } from '@/hooks/use-localized'

const tuple = (p: { latitude: number; longitude: number }): LatLngTuple => [
  p.latitude,
  p.longitude,
]

function FitBounds({ points }: { points: LatLngTuple[] }) {
  const map = useMap()
  useEffect(() => {
    if (points.length) map.fitBounds(points, { padding: [32, 32] })
  }, [map, points])
  return null
}

/**
 * Shipment route on OpenStreetMap (requirements 6): warehouses, passed
 * checkpoints (solid line) and the way still ahead (dashed line). The last
 * checkpoint is the current position while the shipment is in transit.
 */
export function TrackingMap({ tracking }: { tracking: OrderTracking }) {
  const localized = useLocalized()
  const passed = [tracking.origin, ...tracking.checkpoints]
  const current =
    tracking.shipment_status === 'arrived'
      ? tracking.destination
      : passed[passed.length - 1]
  const all = [...passed, tracking.destination].map(tuple)
  const primary = '#2563eb' // SVG attributes don't resolve CSS variables

  return (
    <div className='isolate h-80 overflow-hidden rounded-lg border'>
      <MapContainer
        center={tuple(current)}
        zoom={4}
        scrollWheelZoom={false}
        className='h-full w-full'
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        />
        <FitBounds points={all} />
        <Polyline
          positions={passed.map(tuple)}
          pathOptions={{ color: primary, weight: 4 }}
        />
        {tracking.shipment_status !== 'arrived' && (
          <Polyline
            positions={[tuple(current), tuple(tracking.destination)]}
            pathOptions={{
              color: primary,
              weight: 3,
              dashArray: '6 8',
              opacity: 0.6,
            }}
          />
        )}
        {[tracking.origin, ...tracking.checkpoints, tracking.destination].map(
          (p, i) => (
            <CircleMarker
              key={i}
              center={tuple(p)}
              radius={p === current ? 9 : 6}
              pathOptions={{
                color: primary,
                fillColor: p === current ? '#22c55e' : '#ffffff',
                fillOpacity: 1,
                weight: 3,
              }}
            >
              <Tooltip>
                {localized(p.name)}
                {p.at && <div>{formatDateTime(p.at)}</div>}
              </Tooltip>
            </CircleMarker>
          )
        )}
      </MapContainer>
    </div>
  )
}
