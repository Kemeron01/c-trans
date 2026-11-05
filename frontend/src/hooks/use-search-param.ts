import { useNavigate, useSearch } from '@tanstack/react-router'

/**
 * String or number kept in the URL query (`?filter=active`, `?page=2`).
 * Equal to `fallback` = the parameter is removed from the URL.
 */
export function useSearchParam<T extends string | number>(
  name: string,
  fallback: T
): [T, (value: T) => void] {
  const search = useSearch({ strict: false }) as Record<string, unknown>
  const navigate = useNavigate()
  const raw = search[name]
  const value = (
    typeof fallback === 'number'
      ? Number.isFinite(Number(raw)) && raw !== undefined
        ? Number(raw)
        : fallback
      : typeof raw === 'string'
        ? raw
        : fallback
  ) as T
  const set = (next: T) =>
    navigate({
      replace: true,
      search: ((prev: Record<string, unknown>) => ({
        ...prev,
        [name]: next === fallback ? undefined : next,
      })) as never,
    })
  return [value, set]
}
