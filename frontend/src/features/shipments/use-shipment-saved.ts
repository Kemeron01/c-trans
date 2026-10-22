import { useQueryClient } from '@tanstack/react-query'

/** Shipment changes move orders too: refresh both. */
export function useShipmentSaved() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ['shipments'] })
    queryClient.invalidateQueries({ queryKey: ['orders'] })
  }
}
