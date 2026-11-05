import { useNavigate, useSearch } from '@tanstack/react-router'

/**
 * Boolean flag kept in the URL query (`?active=true`): survives reload and
 * can be shared. Off = the parameter is removed.
 */
export function useSearchFlag(name: string): [boolean, (on: boolean) => void] {
  const search = useSearch({ strict: false }) as Record<string, unknown>
  const navigate = useNavigate()
  const value = search[name]
  const on = value === true || value === 'true'
  const set = (next: boolean) =>
    navigate({
      replace: true,
      // The route search types are per route; this hook is route-agnostic
      search: ((prev: Record<string, unknown>) => ({
        ...prev,
        [name]: next ? true : undefined,
      })) as never,
    })
  return [on, set]
}
