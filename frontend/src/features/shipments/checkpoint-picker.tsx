import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { type LatLngTuple } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Loader2, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  CircleMarker,
  MapContainer,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import { warehousesQuery } from '@/api/reference'
import { type LocalizedText, type Shipment } from '@/api/types'
import {
  type GeoPlace,
  type GeoPoint,
  reversePlace,
  searchPlaces,
} from '@/lib/geocode'
import { getLanguage } from '@/lib/i18n'
import { useLocalized } from '@/hooks/use-localized'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

/** A ready-made point: what the worker sees in the "Ready points" tab. */
export type PickedPlace = GeoPoint & { name: string }

type Preset = GeoPoint & { key: string; name: LocalizedText }

/** Typical stops on the China / Russia → Uzbekistan routes. */
const ROUTE_PRESETS: Preset[] = [
  {
    key: 'yiwu',
    latitude: 29.3069,
    longitude: 120.0751,
    name: { ru: 'Иу', uz: 'Yiwu', en: 'Yiwu' },
  },
  {
    key: 'urumqi',
    latitude: 43.8256,
    longitude: 87.6168,
    name: { ru: 'Урумчи', uz: 'Urumchi', en: 'Urumqi' },
  },
  {
    key: 'khorgos',
    latitude: 44.2085,
    longitude: 80.4075,
    name: {
      ru: 'Граница Хоргос',
      uz: 'Xorgos chegarasi',
      en: 'Khorgos border',
    },
  },
  {
    key: 'almaty',
    latitude: 43.2389,
    longitude: 76.8897,
    name: { ru: 'Алматы', uz: 'Almati', en: 'Almaty' },
  },
  {
    key: 'shymkent',
    latitude: 42.3417,
    longitude: 69.5901,
    name: { ru: 'Шымкент', uz: 'Shimkent', en: 'Shymkent' },
  },
  {
    key: 'orenburg',
    latitude: 51.7682,
    longitude: 55.0969,
    name: { ru: 'Оренбург', uz: 'Orenburg', en: 'Orenburg' },
  },
  {
    key: 'tashkent',
    latitude: 41.2995,
    longitude: 69.2401,
    name: { ru: 'Ташкент', uz: 'Toshkent', en: 'Tashkent' },
  },
]

/** ~1 m precision is plenty for a checkpoint. */
const round = (n: number) => Math.round(n * 1e5) / 1e5

const DEFAULT_CENTER: LatLngTuple = [42, 70]

function MapEvents({
  value,
  onClick,
}: {
  value: PickedPlace | null
  onClick: (p: GeoPoint) => void
}) {
  const map = useMap()
  useMapEvents({
    click: (e) =>
      onClick({
        latitude: round(e.latlng.lat),
        longitude: round(e.latlng.lng),
      }),
  })
  useEffect(() => {
    if (value)
      map.setView([value.latitude, value.longitude], Math.max(map.getZoom(), 5))
  }, [map, value])
  return null
}

/**
 * Pick one point for a checkpoint: from ready-made points, by city search
 * (Nominatim) or by clicking the map. The name is a single string.
 */
export function CheckpointPicker({
  shipment,
  value,
  onChange,
}: {
  shipment: Shipment
  value: PickedPlace | null
  onChange: (place: PickedPlace) => void
}) {
  const { t } = useTranslation()
  const localized = useLocalized()
  const lang = getLanguage()
  const warehouses = useQuery(warehousesQuery())

  const presets = useMemo(() => {
    const own = (warehouses.data ?? [])
      .filter(
        (w) =>
          w.latitude !== null &&
          w.longitude !== null &&
          (w.id === shipment.origin_warehouse.id ||
            w.id === shipment.destination_warehouse.id)
      )
      .map((w) => ({
        key: `w${w.id}`,
        name: w.name,
        latitude: w.latitude as number,
        longitude: w.longitude as number,
      }))
    const route = ROUTE_PRESETS.map((p) => ({ ...p, name: localized(p.name) }))
    return [...own, ...route]
  }, [warehouses.data, shipment, localized])

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GeoPlace[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [geoError, setGeoError] = useState(false)
  const abort = useRef<AbortController | null>(null)

  useEffect(() => () => abort.current?.abort(), [])

  const run = async <T,>(job: (signal: AbortSignal) => Promise<T>) => {
    abort.current?.abort()
    const ctl = new AbortController()
    abort.current = ctl
    setSearching(true)
    setGeoError(false)
    try {
      return await job(ctl.signal)
    } catch {
      if (!ctl.signal.aborted) setGeoError(true)
      return undefined
    } finally {
      if (abort.current === ctl) setSearching(false)
    }
  }

  const search = async () => {
    if (query.trim().length < 2) return
    const found = await run((s) => searchPlaces(query.trim(), lang, s))
    if (found) setResults(found)
  }

  const clickMap = async (point: GeoPoint) => {
    // Show the point at once; the geocoder only suggests a name
    onChange({ ...point, name: value?.name ?? '' })
    const place = await run((s) => reversePlace(point, lang, s))
    if (place) onChange({ ...point, name: place.name })
  }

  const marker: LatLngTuple | null = value
    ? [value.latitude, value.longitude]
    : null

  return (
    <div className='grid gap-3'>
      <Tabs defaultValue='presets'>
        <TabsList>
          <TabsTrigger value='presets'>
            {t('shipments.pickPresets')}
          </TabsTrigger>
          <TabsTrigger value='search'>{t('shipments.pickSearch')}</TabsTrigger>
          <TabsTrigger value='map'>{t('shipments.pickMap')}</TabsTrigger>
        </TabsList>
        <TabsContent value='presets'>
          <div className='flex flex-wrap gap-2'>
            {presets.map((p) => (
              <Button
                key={p.key}
                type='button'
                size='sm'
                variant={
                  value?.latitude === p.latitude &&
                  value.longitude === p.longitude
                    ? 'default'
                    : 'outline'
                }
                onClick={() =>
                  onChange({
                    name: p.name,
                    latitude: p.latitude,
                    longitude: p.longitude,
                  })
                }
              >
                {p.name}
              </Button>
            ))}
          </div>
        </TabsContent>
        <TabsContent value='search' className='grid gap-2'>
          <div className='flex gap-2'>
            <Input
              value={query}
              placeholder={t('shipments.searchPlace')}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  void search()
                }
              }}
            />
            <Button
              type='button'
              variant='outline'
              onClick={() => void search()}
              disabled={searching || query.trim().length < 2}
              aria-label={t('shipments.pickSearch')}
            >
              {searching ? <Loader2 className='animate-spin' /> : <Search />}
            </Button>
          </div>
          {results?.length === 0 && (
            <p className='text-sm text-muted-foreground'>
              {t('shipments.placeNotFound')}
            </p>
          )}
          <ul className='grid gap-1'>
            {results?.map((r, i) => (
              <li key={i}>
                <button
                  type='button'
                  className='w-full rounded-md border p-2 text-left text-sm hover:bg-accent'
                  onClick={() =>
                    onChange({
                      name: r.name,
                      latitude: r.latitude,
                      longitude: r.longitude,
                    })
                  }
                >
                  <span className='font-medium'>{r.name}</span>
                  <span className='line-clamp-1 text-xs text-muted-foreground'>
                    {r.description}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </TabsContent>
        <TabsContent value='map'>
          <p className='text-sm text-muted-foreground'>
            {t('shipments.mapHint')}
          </p>
        </TabsContent>
      </Tabs>

      {geoError && (
        <p role='alert' className='text-sm text-destructive'>
          {t('shipments.geocoderError')}
        </p>
      )}

      <div className='isolate h-56 overflow-hidden rounded-lg border'>
        <MapContainer
          center={marker ?? DEFAULT_CENTER}
          zoom={3}
          className='h-full w-full'
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          />
          <MapEvents value={value} onClick={(p) => void clickMap(p)} />
          {marker && (
            <CircleMarker
              center={marker}
              radius={8}
              pathOptions={{
                color: '#2563eb',
                fillColor: '#22c55e',
                fillOpacity: 1,
                weight: 3,
              }}
            />
          )}
        </MapContainer>
      </div>
    </div>
  )
}
