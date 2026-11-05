import { describe, expect, it } from 'vitest'
import { type PublicWarehouse } from '@/api/types'
import { buildGlobeData } from './globe-data'

const wh = (
  id: number,
  kind: 'foreign' | 'local',
  latitude: number | null,
  longitude: number | null
): PublicWarehouse => ({
  id,
  name: `W${id}`,
  kind,
  country_code: 'XX',
  city: 'City',
  country: { ru: 'c', uz: 'c', en: 'c' },
  address: '',
  latitude,
  longitude,
})

const china = wh(1, 'foreign', 23.1, 113.3)
const moscow = wh(2, 'foreign', 55.7, 37.6)
const tashkent = wh(4, 'local', 41.3, 69.2)

describe('buildGlobeData', () => {
  it('draws a line from every foreign warehouse to the Uzbek one', () => {
    const { markers, arcs, focusLongitude } = buildGlobeData([
      china,
      moscow,
      tashkent,
    ])
    expect(markers).toHaveLength(3)
    expect(arcs).toEqual([
      { id: 'a1-4', from: [23.1, 113.3], to: [41.3, 69.2] },
      { id: 'a2-4', from: [55.7, 37.6], to: [41.3, 69.2] },
    ])
    expect(focusLongitude).toBe(69.2)
  })

  it('skips warehouses without coordinates', () => {
    const { markers, arcs } = buildGlobeData([
      china,
      wh(3, 'foreign', null, null),
      wh(5, 'foreign', 10, null),
      tashkent,
    ])
    expect(markers.map((m) => m.id)).toEqual(['w1', 'w4'])
    expect(arcs.map((a) => a.id)).toEqual(['a1-4'])
  })

  it('adds a line for a new warehouse without code changes', () => {
    const usa = wh(3, 'foreign', 40.7, -74)
    const before = buildGlobeData([china, tashkent]).arcs
    const after = buildGlobeData([china, usa, tashkent]).arcs
    expect(after).toHaveLength(before.length + 1)
    expect(after.some((a) => a.id === 'a3-4')).toBe(true)
  })

  it('has no lines without an Uzbek warehouse', () => {
    const data = buildGlobeData([china, moscow])
    expect(data.arcs).toEqual([])
    expect(data.focusLongitude).toBe(60)
  })
})
