import { type PublicWarehouse } from '@/api/types'

export type GlobeMarker = {
  id: string
  location: [number, number]
  size: number
}
export type GlobeArc = {
  id: string
  from: [number, number]
  to: [number, number]
}

export type GlobeData = {
  markers: GlobeMarker[]
  arcs: GlobeArc[]
  /** Longitude to turn to the viewer first: the Uzbek warehouse. */
  focusLongitude: number
}

const DEFAULT_FOCUS_LONGITUDE = 60

/**
 * Globe points and delivery lines from the public warehouses: a marker for
 * every warehouse with coordinates and a line from each foreign warehouse
 * to each local (Uzbek) one. Warehouses without coordinates are skipped.
 */
export function buildGlobeData(warehouses: PublicWarehouse[]): GlobeData {
  const located = warehouses.filter(
    (w) => w.latitude !== null && w.longitude !== null
  )
  const at = (w: PublicWarehouse): [number, number] => [
    w.latitude as number,
    w.longitude as number,
  ]
  const foreign = located.filter((w) => w.kind === 'foreign')
  const local = located.filter((w) => w.kind === 'local')
  return {
    markers: located.map((w) => ({
      id: `w${w.id}`,
      location: at(w),
      size: w.kind === 'local' ? 0.09 : 0.06,
    })),
    arcs: foreign.flatMap((f) =>
      local.map((l) => ({ id: `a${f.id}-${l.id}`, from: at(f), to: at(l) }))
    ),
    focusLongitude: local[0]?.longitude ?? DEFAULT_FOCUS_LONGITUDE,
  }
}
