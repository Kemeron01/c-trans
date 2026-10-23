import { useQuery } from '@tanstack/react-query'
import { pricingQuery, publicWarehousesQuery } from '@/api/account'
import {
  type DeliveryMethod,
  type Dimensions,
  type ReceiveMethod,
} from '@/api/types'
import { quoteOrder } from '@/lib/pricing'

/** Live order price on the client (backend recomputes on submit). */
export function useOrderQuote({
  originId,
  destinationId,
  method,
  receive,
  dimensions,
  goodsUsd = 0,
}: {
  originId: number | null
  destinationId: number | null
  method: DeliveryMethod
  receive: ReceiveMethod
  dimensions: Dimensions | null
  goodsUsd?: number
}) {
  const origin = useQuery({
    ...pricingQuery(originId ?? 0),
    enabled: !!originId,
  })
  const destination = useQuery({
    ...pricingQuery(destinationId ?? 0),
    enabled: !!destinationId && receive === 'courier',
  })
  const methods = (['auto', 'avia'] as DeliveryMethod[]).filter((m) =>
    origin.data?.tariffs.some((t) => t.method === m)
  )
  const quote =
    dimensions && origin.data?.settings
      ? quoteOrder({
          dimensions,
          method,
          settings: origin.data.settings,
          tariffs: origin.data.tariffs,
          goodsUsd,
          courierTariffs:
            receive === 'courier'
              ? (destination.data?.courier_tariffs ?? [])
              : undefined,
        })
      : null
  return {
    quote,
    methods,
    minWeight: origin.data?.settings?.min_weight_kg ?? 0,
  }
}

/**
 * Uzbek warehouses and the chosen one. Open question 5: the client picks
 * the destination; until then — the first warehouse.
 */
export function useDestination(chosen: number | null) {
  const local = (useQuery(publicWarehousesQuery()).data ?? []).filter(
    (w) => w.kind === 'local'
  )
  return { local, destinationId: chosen ?? local[0]?.id ?? null }
}
