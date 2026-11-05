import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DoubleArrowLeftIcon,
  DoubleArrowRightIcon,
} from '@radix-ui/react-icons'
import { type Table } from '@tanstack/react-table'
import { useTranslation } from 'react-i18next'
import { cn, getPageNumbers } from '@/lib/utils'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from '@/components/ui/pagination'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageLink } from '@/components/page-link'

type DataTablePaginationProps<TData> = {
  table: Table<TData>
  className?: string
}

export function DataTablePagination<TData>({
  table,
  className,
}: DataTablePaginationProps<TData>) {
  const { t } = useTranslation()
  const currentPage = table.getState().pagination.pageIndex + 1
  const totalPages = table.getPageCount()
  const pageNumbers = getPageNumbers(currentPage, totalPages)

  return (
    <div
      className={cn(
        'flex items-center justify-between overflow-clip px-2',
        '@max-2xl/content:flex-col-reverse @max-2xl/content:gap-4',
        className
      )}
      style={{ overflowClipMargin: 1 }}
    >
      <div className='flex w-full items-center justify-between'>
        <div className='flex items-center justify-center text-sm font-medium @2xl/content:hidden'>
          {t('dataTable.pageOf', { page: currentPage, total: totalPages })}
        </div>
        <div className='flex items-center gap-2 @max-2xl/content:flex-row-reverse'>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value))
            }}
          >
            <SelectTrigger className='h-8 w-17.5'>
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side='top'>
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className='hidden text-sm font-medium sm:block'>
            {t('dataTable.rowsPerPage')}
          </p>
        </div>
      </div>

      <div className='flex items-center sm:space-x-6 lg:space-x-8'>
        <div className='flex items-center justify-center text-sm font-medium @max-3xl/content:hidden'>
          {t('dataTable.pageOf', { page: currentPage, total: totalPages })}
        </div>
        <Pagination className='mx-0 w-auto'>
          <PaginationContent>
            <PaginationItem className='@max-md/content:hidden'>
              <PageLink
                label={t('dataTable.firstPage')}
                disabled={!table.getCanPreviousPage()}
                onSelect={() => table.setPageIndex(0)}
              >
                <DoubleArrowLeftIcon className='h-4 w-4' />
              </PageLink>
            </PaginationItem>
            <PaginationItem>
              <PageLink
                label={t('dataTable.previousPage')}
                disabled={!table.getCanPreviousPage()}
                onSelect={() => table.previousPage()}
              >
                <ChevronLeftIcon className='h-4 w-4' />
              </PageLink>
            </PaginationItem>

            {pageNumbers.map((pageNumber, index) => (
              <PaginationItem key={`${pageNumber}-${index}`}>
                {pageNumber === '...' ? (
                  <PaginationEllipsis className='size-8' />
                ) : (
                  <PageLink
                    label={t('dataTable.goToPage', { page: pageNumber })}
                    isActive={currentPage === pageNumber}
                    onSelect={() =>
                      table.setPageIndex((pageNumber as number) - 1)
                    }
                  >
                    {pageNumber}
                  </PageLink>
                )}
              </PaginationItem>
            ))}

            <PaginationItem>
              <PageLink
                label={t('dataTable.nextPage')}
                disabled={!table.getCanNextPage()}
                onSelect={() => table.nextPage()}
              >
                <ChevronRightIcon className='h-4 w-4' />
              </PageLink>
            </PaginationItem>
            <PaginationItem className='@max-md/content:hidden'>
              <PageLink
                label={t('dataTable.lastPage')}
                disabled={!table.getCanNextPage()}
                onSelect={() => table.setPageIndex(table.getPageCount() - 1)}
              >
                <DoubleArrowRightIcon className='h-4 w-4' />
              </PageLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}
