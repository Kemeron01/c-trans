import {
  type DeliveryMethod,
  type Dimensions,
  type Tariff,
  type WarehouseSettings,
  type WeightRange,
} from '@/api/types'

// Delivery price formula, docs/requirements.md section 4.1:
//   volume_weight     = L × W × H / divisor(method)
//   chargeable_weight = max(actual_weight, volume_weight)
//   delivery_usd      = chargeable_weight × price_per_kg(range(chargeable_weight))
// The backend is the source of truth; this is used for previews (calculator,
// preliminary prices) and by the mocks.

const round = (value: number, digits = 2) =>
  Math.round(value * 10 ** digits) / 10 ** digits

/** Range semantics: [weight_from, weight_to), weight_to = null — no upper bound. */
export function findRange<T extends WeightRange>(ranges: T[], weight: number) {
  return ranges.find(
    (r) =>
      weight >= r.weight_from && (r.weight_to === null || weight < r.weight_to)
  )
}

/** Two ranges overlap if they share any weight. */
export function rangesOverlap(a: WeightRange, b: WeightRange) {
  const aTo = a.weight_to ?? Infinity
  const bTo = b.weight_to ?? Infinity
  return a.weight_from < bTo && b.weight_from < aTo
}

export function volumeWeight(d: Dimensions, divisor: number) {
  return round((d.length_cm * d.width_cm * d.height_cm) / divisor)
}

export type DeliveryQuote = {
  volume_weight: number
  chargeable_weight: number
  tariff: Tariff | null
  /** null when no tariff covers the weight. */
  delivery_usd: number | null
  below_minimum: boolean
}

export function quoteDelivery({
  dimensions,
  method,
  settings,
  tariffs,
}: {
  dimensions: Dimensions
  method: DeliveryMethod
  settings: WarehouseSettings
  tariffs: Tariff[]
}): DeliveryQuote {
  const volume = volumeWeight(dimensions, settings.volume_divisor[method])
  const chargeable = round(Math.max(dimensions.weight_kg, volume))
  const tariff =
    findRange(
      tariffs.filter(
        (t) => t.method === method && t.warehouse_id === settings.warehouse_id
      ),
      chargeable
    ) ?? null
  return {
    volume_weight: volume,
    chargeable_weight: chargeable,
    tariff,
    delivery_usd: tariff ? round(chargeable * tariff.price_per_kg) : null,
    below_minimum: chargeable < settings.min_weight_kg,
  }
}

export const toUzs = (usd: number, rate: number) => Math.round(usd * rate)
