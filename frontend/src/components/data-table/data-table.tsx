import { useState } from 'react'
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
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
import { type ServerTable } from '@/hooks/use-server-table'
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
}: DataTableProps<TData>) {
  const { t } = useTranslation()
  const [localSorting, setSorting] = useState<SortingState>(() =>
    columns.some(
      (c) =>
        c.id === 'created_at' ||
        ('accessorKey' in c && c.accessorKey === 'created_at')
    )
      ? [{ id: 'created_at', desc: true }]
      : []
  )
  const [columnFilters, setColumnFilters] =
    useState<ColumnFiltersState>(initialColumnFilters)
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [localGlobalFilter, setGlobalFilter] = useState('')
  const sorting = server?.sorting ?? localSorting
  const globalFilter = server?.globalFilter ?? localGlobalFilter

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable<TData>({
    data: data ?? [],
    columns,
    state: {
      sorting,
      columnFilters: server?.columnFilters ?? columnFilters,
      columnVisibility,
      globalFilter,
      ...(server && { pagination: server.pagination }),
    },
    onSortingChange: server?.onSortingChange ?? setSorting,
    onColumnFiltersChange: server?.onColumnFiltersChange ?? setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: server?.onGlobalFilterChange ?? setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    ...(server
      ? {
          manualPagination: true,
          manualSorting: true,
          manualFiltering: true,
          rowCount: server.rowCount,
          onPaginationChange: server.onPaginationChange,
        }
      : {
          getFilteredRowModel: getFilteredRowModel(),
          getSortedRowModel: getSortedRowModel(),
          getPaginationRowModel: getPaginationRowModel(),
          getFacetedRowModel: getFacetedRowModel(),
          getFacetedUniqueValues: getFacetedUniqueValues(),
        }),
  })

  return (
    <div className='flex flex-1 flex-col gap-4'>
      <DataTableToolbar
        table={table}
        searchPlaceholder={searchPlaceholder}
        filters={filters}
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
              table.getRowModel().rows.map((row) => (
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
              ))
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
