import { useQuery } from '@tanstack/react-query'
import { rateQuery } from '@/api/setup'
import { formatUzs } from '@/lib/format'
import { toUzs } from '@/lib/pricing'

/** USD → formatted UZS at today's CBU rate (prices are shown in both, 4.3). */
export function useUzs() {
  const rate = useQuery(rateQuery()).data?.rate
  return {
    rate,
    uzs: (usd: number | null | undefined) =>
      rate && usd !== null && usd !== undefined
        ? formatUzs(toUzs(usd, rate))
        : '—',
  }
}
