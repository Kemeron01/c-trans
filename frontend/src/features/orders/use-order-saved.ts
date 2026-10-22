import { useQueryClient } from '@tanstack/react-query'

/** Refreshes the order list and every open order page. */
export function useOrderSaved() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['orders'] })
}
