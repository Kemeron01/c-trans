import { useEffect, useState } from 'react'
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
  /** Backend `ordering` used until the user sorts. */
  ordering?: string
  pageSize?: number
  /** Table column id → backend query parameter (array filters → `a,b`). */
  filterParams?: Record<string, string>
  /** Table column id → backend ordering field, when they differ. */
  orderingFields?: Record<string, string>
  /** Filters applied on first render. */
  initialFilters?: ColumnFiltersState
  /** Constant parameters of this list (e.g. `type=delivery`). */
  fixed?: ListParams
}

const SEARCH_DEBOUNCE_MS = 300

const toSorting = (ordering: string, fields: Record<string, string>) => {
  const desc = ordering.startsWith('-')
  const field = desc ? ordering.slice(1) : ordering
  const id = Object.keys(fields).find((k) => fields[k] === field) ?? field
  return [{ id, desc }]
}

/**
 * State of a server-paginated table: turns page / sorting / filters /
 * search into the `ListParams` of the request (page, page_size, ordering,
 * search, filters). Changing a filter, the search or the page size goes
 * back to page 1.
 */
export function useServerTable(config: Config = {}) {
  const {
    ordering: defaultOrdering = '-created_at',
    pageSize = 10,
    filterParams = {},
    orderingFields = {},
    initialFilters = [],
    fixed,
  } = config

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  })
  const [sorting, setSorting] = useState<SortingState>(() =>
    toSorting(defaultOrdering, orderingFields)
  )
  const [columnFilters, setColumnFilters] =
    useState<ColumnFiltersState>(initialFilters)
  const [globalFilter, setGlobalFilter] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const id = setTimeout(
      () => setSearch(globalFilter.trim()),
      SEARCH_DEBOUNCE_MS
    )
    return () => clearTimeout(id)
  }, [globalFilter])

  const firstPage = () => setPagination((p) => ({ ...p, pageIndex: 0 }))

  // Not memoised: react-query hashes the params by content
  const params: ListParams = { ...fixed }
  params.page = pagination.pageIndex + 1
  params.page_size = pagination.pageSize
  const sort = sorting[0]
  params.ordering = sort
    ? `${sort.desc ? '-' : ''}${orderingFields[sort.id] ?? sort.id}`
    : defaultOrdering
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
    onPaginationChange: (updater) => {
      const next = typeof updater === 'function' ? updater(pagination) : updater
      // A new page size makes the old page number meaningless
      setPagination(
        next.pageSize === pagination.pageSize ? next : { ...next, pageIndex: 0 }
      )
    },
    sorting,
    onSortingChange: (updater) => {
      setSorting(updater)
      firstPage()
    },
    columnFilters,
    onColumnFiltersChange: (updater) => {
      setColumnFilters(updater)
      firstPage()
    },
    globalFilter,
    onGlobalFilterChange: (updater) => {
      setGlobalFilter(updater)
      firstPage()
    },
  })

  return { params, bind }
}
