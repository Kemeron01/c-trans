import { type Language } from '@/api/types'

export type GeoPoint = { latitude: number; longitude: number }

export type GeoPlace = GeoPoint & { name: string; description: string }

const round = (n: number) => Math.round(n * 1e5) / 1e5

const NOMINATIM = 'https://nominatim.openstreetmap.org'

type NominatimItem = {
  lat: string
  lon: string
  name?: string
  display_name: string
}

const toPlace = (item: NominatimItem): GeoPlace => ({
  latitude: round(Number(item.lat)),
  longitude: round(Number(item.lon)),
  name: item.name || item.display_name.split(',')[0].trim(),
  description: item.display_name,
})

/**
 * City / place search (Nominatim). Per its usage policy it must be run on
 * an explicit user action (Enter / button), not on every keystroke.
 */
export async function searchPlaces(
  query: string,
  language: Language,
  signal?: AbortSignal
): Promise<GeoPlace[]> {
  const url = new URL(`${NOMINATIM}/search`)
  url.search = new URLSearchParams({
    q: query,
    format: 'jsonv2',
    limit: '6',
    'accept-language': language,
  }).toString()
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`Nominatim ${res.status}`)
  return ((await res.json()) as NominatimItem[]).map(toPlace)
}

/** Name of the place under a map click; null when the point is nowhere. */
export async function reversePlace(
  point: GeoPoint,
  language: Language,
  signal?: AbortSignal
): Promise<GeoPlace | null> {
  const url = new URL(`${NOMINATIM}/reverse`)
  url.search = new URLSearchParams({
    lat: String(point.latitude),
    lon: String(point.longitude),
    format: 'jsonv2',
    zoom: '10', // settlement level: city / town / village
    'accept-language': language,
  }).toString()
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`Nominatim ${res.status}`)
  const item = (await res.json()) as Partial<NominatimItem> & {
    error?: string
  }
  if (item.error || !item.display_name) return null
  // Keep the exact clicked point, only the name comes from the geocoder
  return { ...toPlace(item as NominatimItem), ...point }
}
