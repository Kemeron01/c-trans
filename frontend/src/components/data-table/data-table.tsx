import { useEffect, useState } from 'react'
import {
  type ColumnDef,
  type ColumnFiltersState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { type ServerTable, useServerTable } from '@/hooks/use-server-table'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataTablePagination } from './pagination'
import { RowContextMenu } from './row-actions'
import { DataTableToolbar } from './toolbar'

type DataTableProps<TData> = {
  columns: ColumnDef<TData>[]
  data: TData[] | undefined
  isLoading?: boolean
  searchPlaceholder?: string
  filters?: React.ComponentProps<typeof DataTableToolbar>['filters']
  /** Filters applied on first render, e.g. only open leads. */
  initialColumnFilters?: ColumnFiltersState
  /**
   * Server mode: `data` is only the current page, and paging, sorting,
   * search and filters are done by the backend (see `useServerTable`).
   */
  server?: ServerTable
  /** Extra quick filters in the toolbar (e.g. <ActiveToggle />). */
  toolbarExtra?: React.ReactNode
}

/**
 * Table with two modes. Client mode (default): sorting, filtering and
 * pagination in the browser, for small reference lists; newest first when
 * the rows have a `created_at` column. Server mode (`server` prop): the
 * backend pages, sorts and filters; for lists that grow (orders, shipments).
 */
export function DataTable<TData>({
  columns,
  data,
  isLoading,
  searchPlaceholder,
  filters,
  initialColumnFilters = [],
  server,
  toolbarExtra,
}: DataTableProps<TData>) {
  const { t } = useTranslation()
  // The table state lives in the URL in both modes (page, page_size,
  // ordering, search, filters). Client mode sorts/filters/pages the rows in
  // the browser; server mode lets the backend do it.
  const hasCreatedAt = columns.some(
    (c) =>
      c.id === 'created_at' ||
      ('accessorKey' in c && c.accessorKey === 'created_at')
  )
  const filterIds = [
    ...(filters ?? []).map((f) => f.columnId),
    ...initialColumnFilters.map((f) => f.id),
  ]
  const urlTable = useServerTable({
    ordering: hasCreatedAt ? '-created_at' : '',
    filterParams: Object.fromEntries(filterIds.map((id) => [id, id])),
    initialFilters: initialColumnFilters,
  }).bind(0)
  const state = server ?? urlTable
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable<TData>({
    data: data ?? [],
    columns,
    state: {
      sorting: state.sorting,
      columnFilters: state.columnFilters,
      columnVisibility,
      globalFilter: state.globalFilter,
      pagination: state.pagination,
    },
    onSortingChange: state.onSortingChange,
    onColumnFiltersChange: state.onColumnFiltersChange,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: state.onGlobalFilterChange,
    onPaginationChange: state.onPaginationChange,
    // Filters / search / sorting reset the page themselves (in the URL hook)
    autoResetPageIndex: false,
    getCoreRowModel: getCoreRowModel(),
    ...(server
      ? {
          manualPagination: true,
          manualSorting: true,
          manualFiltering: true,
          rowCount: server.rowCount,
        }
      : {
          getFilteredRowModel: getFilteredRowModel(),
          getSortedRowModel: getSortedRowModel(),
          getPaginationRowModel: getPaginationRowModel(),
          getFacetedRowModel: getFacetedRowModel(),
          getFacetedUniqueValues: getFacetedUniqueValues(),
        }),
  })

  // A link to a page that no longer exists (fewer rows now) shows the last one
  const pageCount = table.getPageCount()
  const pageIndex = state.pagination.pageIndex
  const onPaginationChange = state.onPaginationChange
  useEffect(() => {
    if (!isLoading && pageCount > 0 && pageIndex >= pageCount) {
      onPaginationChange((p) => ({ ...p, pageIndex: pageCount - 1 }))
    }
  }, [isLoading, pageCount, pageIndex, onPaginationChange])

  // Right-click menu: the same actions as the "⋯" column (see actionsColumn)
  const getRowActions = columns.find((c) => c.meta?.rowActions)?.meta
    ?.rowActions

  return (
    <div className='flex flex-1 flex-col gap-4'>
      <DataTableToolbar
        table={table}
        searchPlaceholder={searchPlaceholder}
        filters={filters}
        extra={toolbarExtra}
      />
      <div className='overflow-hidden rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    className={cn(
                      header.column.columnDef.meta?.className,
                      header.column.columnDef.meta?.thClassName
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }, (_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={columns.length}>
                    <Skeleton className='h-6 w-full' />
                  </TableCell>
                </TableRow>
              ))
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => {
                const tableRow = (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          cell.column.columnDef.meta?.className,
                          cell.column.columnDef.meta?.tdClassName
                        )}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                )
                const actions = getRowActions?.(row.original)
                return actions?.some((a) => !a.hidden) ? (
                  <RowContextMenu key={row.id} actions={actions}>
                    {tableRow}
                  </RowContextMenu>
                ) : (
                  tableRow
                )
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center text-muted-foreground'
                >
                  {t('dataTable.noResults')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} className='mt-auto' />
    </div>
  )
}
