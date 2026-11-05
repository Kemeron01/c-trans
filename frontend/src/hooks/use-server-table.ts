import { useEffect, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import type {
  ColumnFiltersState,
  OnChangeFn,
  PaginationState,
  SortingState,
} from '@tanstack/react-table'
import { type ListParams } from '@/api/types'

/** Table state handed to <DataTable server={...}>: the data is paged remotely. */
export type ServerTable = {
  rowCount: number
  pagination: PaginationState
  onPaginationChange: OnChangeFn<PaginationState>
  sorting: SortingState
  onSortingChange: OnChangeFn<SortingState>
  columnFilters: ColumnFiltersState
  onColumnFiltersChange: OnChangeFn<ColumnFiltersState>
  globalFilter: string
  onGlobalFilterChange: OnChangeFn<string>
}

type Config = {
  /** Backend `ordering` used until the user sorts (`''` = unsorted). */
  ordering?: string
  pageSize?: number
  /** Table column id → URL / backend query parameter (array filters → `a,b`). */
  filterParams?: Record<string, string>
  /** Table column id → backend ordering field, when they differ. */
  orderingFields?: Record<string, string>
  /** Filters applied while the URL has no value for them. */
  initialFilters?: ColumnFiltersState
  /** Constant parameters of this list (e.g. `type=delivery`). */
  fixed?: ListParams
}

const SEARCH_DEBOUNCE_MS = 300
/** URL value of a filter the user cleared although it has a default. */
const NO_FILTER = '-'

const toSorting = (ordering: string, fields: Record<string, string>) => {
  if (!ordering) return []
  const desc = ordering.startsWith('-')
  const field = desc ? ordering.slice(1) : ordering
  const id = Object.keys(fields).find((k) => fields[k] === field) ?? field
  return [{ id, desc }]
}

const positiveInt = (raw: unknown) => {
  const n = Number(raw)
  return Number.isInteger(n) && n > 0 ? n : null
}

/**
 * State of a table kept in the URL: `page`, `page_size`, `ordering`, `search`
 * and the filters (`status=a,b`, …). A direct link opens the same view, and
 * "Back" returns to the previous page / filter (changes push history entries;
 * typing in the search box only replaces the current one). Changing a
 * filter, the sorting, the search or the page size goes back to page 1.
 *
 * Server tables send `params` to the API; client tables (DataTable without
 * `server`) only use the state through `bind`.
 */
export function useServerTable(config: Config = {}) {
  const {
    ordering: defaultOrdering = '-created_at',
    pageSize: defaultPageSize = 10,
    filterParams = {},
    orderingFields = {},
    initialFilters = [],
    fixed,
  } = config

  const urlSearch = useSearch({ strict: false }) as Record<string, unknown>
  const navigate = useNavigate()
  const patchUrl = (patch: Record<string, unknown>, replace = false) =>
    navigate({
      replace,
      // Route search types are per route; this hook is route-agnostic
      search: ((prev: Record<string, unknown>) => {
        const next = { ...prev, ...patch }
        for (const k of Object.keys(next)) {
          if (next[k] === undefined) delete next[k]
        }
        return next
      }) as never,
    })

  // ---- state read from the URL
  const pagination: PaginationState = {
    pageIndex: (positiveInt(urlSearch.page) ?? 1) - 1,
    pageSize: positiveInt(urlSearch.page_size) ?? defaultPageSize,
  }
  const ordering =
    typeof urlSearch.ordering === 'string'
      ? urlSearch.ordering
      : defaultOrdering
  const sorting = toSorting(ordering, orderingFields)
  const columnFilters: ColumnFiltersState = []
  for (const [columnId, param] of Object.entries(filterParams)) {
    const raw = urlSearch[param]
    const value =
      raw === undefined
        ? (initialFilters.find((f) => f.id === columnId)?.value as
            | string[]
            | undefined)
        : raw === NO_FILTER
          ? []
          : String(raw).split(',').filter(Boolean)
    if (value?.length) columnFilters.push({ id: columnId, value })
  }
  const urlText = urlSearch.search === undefined ? '' : String(urlSearch.search)

  // Search box: typed text shows at once, the URL follows after a pause
  const [typed, setTyped] = useState<string | null>(null)
  const globalFilter = typed ?? urlText
  useEffect(() => {
    if (typed === null) return
    const id = setTimeout(() => {
      patchUrl({ search: typed.trim() || undefined, page: undefined }, true)
      setTyped(null)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(id)
    // patchUrl is recreated every render and only closes over `navigate`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typed])

  // ---- request parameters
  // Not memoised: react-query hashes the params by content
  const params: ListParams = { ...fixed }
  params.page = pagination.pageIndex + 1
  params.page_size = pagination.pageSize
  const sort = sorting[0]
  params.ordering = sort
    ? `${sort.desc ? '-' : ''}${orderingFields[sort.id] ?? sort.id}`
    : defaultOrdering
  const search = urlText.trim()
  if (search) params.search = search
  for (const f of columnFilters) {
    const param = filterParams[f.id]
    if (param && Array.isArray(f.value) && f.value.length) {
      params[param] = f.value.join(',')
    }
  }

  /** Binds the state to the row count of the loaded page. */
  const bind = (rowCount: number): ServerTable => ({
    rowCount,
    pagination,
    globalFilter,
    sorting,
    columnFilters,
    onPaginationChange: (updater) => {
      const next = typeof updater === 'function' ? updater(pagination) : updater
      const sizeChanged = next.pageSize !== pagination.pageSize
      patchUrl({
        page:
          sizeChanged || next.pageIndex === 0 ? undefined : next.pageIndex + 1,
        page_size:
          next.pageSize === defaultPageSize ? undefined : next.pageSize,
      })
    },
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater
      const first = next[0]
      const value = first
        ? `${first.desc ? '-' : ''}${orderingFields[first.id] ?? first.id}`
        : defaultOrdering
      patchUrl({
        ordering: value === defaultOrdering ? undefined : value,
        page: undefined,
      })
    },
    onColumnFiltersChange: (updater) => {
      const next =
        typeof updater === 'function' ? updater(columnFilters) : updater
      const patch: Record<string, unknown> = { page: undefined }
      for (const [columnId, param] of Object.entries(filterParams)) {
        const value = next.find((f) => f.id === columnId)?.value
        const list = Array.isArray(value) ? value : []
        const hasDefault = initialFilters.some((f) => f.id === columnId)
        patch[param] = list.length
          ? list.join(',')
          : hasDefault
            ? NO_FILTER
            : undefined
      }
      patchUrl(patch)
    },
    onGlobalFilterChange: (updater) => {
      setTyped(typeof updater === 'function' ? updater(globalFilter) : updater)
    },
  })

  return { params, bind }
}
