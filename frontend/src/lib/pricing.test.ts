import { describe, expect, it } from 'vitest'
import { type Tariff, type WarehouseSettings } from '@/api/types'
import {
  findRange,
  itemsDimensions,
  quoteDelivery,
  quoteOrder,
  rangesOverlap,
  toUzs,
} from './pricing'

const settings: WarehouseSettings = {
  warehouse_id: 1,
  min_weight_kg: 10,
  volume_divisor: { avia: 6000, auto: 5000 },
}

const tariff = (
  id: number,
  weight_from: number,
  weight_to: number | null,
  price_per_kg: number,
  method: Tariff['method'] = 'auto'
): Tariff => ({
  id,
  warehouse_id: 1,
  method,
  weight_from,
  weight_to,
  price_per_kg,
})

const tariffs = [
  tariff(1, 10, 50, 4),
  tariff(2, 50, 100, 3.5),
  tariff(3, 100, null, 3),
  tariff(4, 0, null, 8, 'avia'),
]

describe('findRange', () => {
  it('uses [from, to) boundaries and an open last range', () => {
    expect(findRange(tariffs, 50)?.id).toBe(2)
    expect(findRange(tariffs, 49.99)?.id).toBe(1)
    expect(findRange(tariffs, 1000)?.id).toBe(3)
    expect(findRange(tariffs.slice(0, 3), 5)).toBeUndefined()
  })
})

describe('rangesOverlap', () => {
  it('treats touching ranges as not overlapping', () => {
    expect(
      rangesOverlap(
        { weight_from: 10, weight_to: 50 },
        { weight_from: 50, weight_to: 100 }
      )
    ).toBe(false)
    expect(
      rangesOverlap(
        { weight_from: 10, weight_to: 50 },
        { weight_from: 40, weight_to: null }
      )
    ).toBe(true)
  })
})

describe('quoteDelivery', () => {
  it('charges the actual weight when it exceeds the volume weight', () => {
    const quote = quoteDelivery({
      dimensions: { weight_kg: 60, length_cm: 50, width_cm: 50, height_cm: 50 },
      method: 'auto',
      settings,
      tariffs,
    })
    expect(quote.volume_weight).toBe(25)
    expect(quote.chargeable_weight).toBe(60)
    expect(quote.tariff?.id).toBe(2)
    expect(quote.delivery_usd).toBe(210)
    expect(quote.below_minimum).toBe(false)
  })

  it('charges the volume weight for light bulky cargo', () => {
    const quote = quoteDelivery({
      dimensions: { weight_kg: 5, length_cm: 100, width_cm: 60, height_cm: 50 },
      method: 'auto',
      settings,
      tariffs,
    })
    expect(quote.chargeable_weight).toBe(60)
    expect(quote.delivery_usd).toBe(210)
  })

  it('uses the divisor and tariffs of the chosen method', () => {
    const quote = quoteDelivery({
      dimensions: { weight_kg: 5, length_cm: 100, width_cm: 60, height_cm: 50 },
      method: 'avia',
      settings,
      tariffs,
    })
    expect(quote.chargeable_weight).toBe(50)
    expect(quote.delivery_usd).toBe(400)
  })

  it('flags weight below the warehouse minimum and missing tariffs', () => {
    const quote = quoteDelivery({
      dimensions: { weight_kg: 3, length_cm: 10, width_cm: 10, height_cm: 10 },
      method: 'auto',
      settings,
      tariffs,
    })
    expect(quote.below_minimum).toBe(true)
    expect(quote.tariff).toBeNull()
    expect(quote.delivery_usd).toBeNull()
  })
})

describe('toUzs', () => {
  it('rounds to whole sums', () => {
    expect(toUzs(12.5, 12650.55)).toBe(158132)
  })
})

describe('quoteOrder', () => {
  it('adds goods and the courier price for the chargeable weight', () => {
    const quote = quoteOrder({
      dimensions: itemsDimensions([
        {
          product: {
            weight_kg: 10,
            length_cm: 50,
            width_cm: 40,
            height_cm: 30,
          },
          quantity: 3,
        },
      ]),
      method: 'auto',
      settings,
      tariffs,
      goodsUsd: 90,
      courierTariffs: [
        { id: 1, warehouse_id: 4, weight_from: 0, weight_to: 50, price: 6 },
        { id: 2, warehouse_id: 4, weight_from: 50, weight_to: null, price: 12 },
      ],
    })
    // 3 × 10 kg = 30 kg; volume 3 × 60000 / 5000 = 36 kg → 36 × 4 = 144
    expect(quote.chargeable_weight).toBe(36)
    expect(quote.delivery_usd).toBe(144)
    expect(quote.courier_usd).toBe(6)
    expect(quote.total_usd).toBe(240)
  })

  it('has no total when delivery cannot be priced', () => {
    const quote = quoteOrder({
      dimensions: { weight_kg: 1, length_cm: 1, width_cm: 1, height_cm: 1 },
      method: 'auto',
      settings,
      tariffs,
      goodsUsd: 10,
    })
    expect(quote.total_usd).toBeNull()
  })
})
