import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { type ColumnDef } from '@tanstack/react-table'
import { useTranslation } from 'react-i18next'
import { reviewsQuery } from '@/api/analytics'
import { type Review } from '@/api/types'
import { formatDateTime } from '@/lib/format'
import { DataTable, inSelected } from '@/components/data-table'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { PageHeading } from '@/components/layout/page-heading'
import { RatingStars } from '@/components/rating-stars'

/** Section 11: visible to the warehouse admin and the super-admin only. */
export function Reviews() {
  const { t } = useTranslation()
  const { data, isLoading } = useQuery(reviewsQuery())

  const columns: ColumnDef<Review>[] = [
    {
      id: 'order',
      accessorFn: (r) =>
        `${r.order_number} ${r.client.full_name} ${r.client.client_code}`,
      header: t('reviews.order'),
      cell: ({ row }) => (
        <div>
          <Link
            to='/admin/orders/$orderId'
            params={{ orderId: String(row.original.order_id) }}
            className='font-medium underline-offset-4 hover:underline'
          >
            {row.original.order_number}
          </Link>
          <div className='text-xs text-muted-foreground'>
            {row.original.client.full_name} ·{' '}
            {formatDateTime(row.original.created_at)}
          </div>
        </div>
      ),
    },
    {
      id: 'delivery',
      accessorFn: (r) => String(r.delivery.rating),
      header: t('reviews.delivery'),
      filterFn: inSelected,
      cell: ({ row }) => <Rated value={row.original.delivery} />,
    },
    {
      id: 'product',
      header: t('reviews.product'),
      cell: ({ row }) =>
        row.original.product ? (
          <Rated value={row.original.product} />
        ) : (
          <span className='text-muted-foreground'>—</span>
        ),
    },
  ]

  return (
    <>
      <AppHeader />
      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <PageHeading
          title={t('nav.sections.reviews')}
          description={t('reviews.description')}
        />
        <DataTable
          columns={columns}
          data={data}
          isLoading={isLoading}
          searchPlaceholder={t('reviews.search')}
          filters={[
            {
              columnId: 'delivery',
              title: t('reviews.deliveryRating'),
              options: ['5', '4', '3', '2', '1'].map((v) => ({
                value: v,
                label: '★'.repeat(Number(v)),
              })),
            },
          ]}
        />
      </Main>
    </>
  )
}

function Rated({ value }: { value: Review['delivery'] }) {
  return (
    <div className='grid max-w-72 gap-1 whitespace-normal'>
      <RatingStars value={value.rating} />
      {value.comment && <span className='text-sm'>{value.comment}</span>}
    </div>
  )
}
