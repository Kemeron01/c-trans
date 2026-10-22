import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { type ColumnDef } from '@tanstack/react-table'
import { Pencil, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { countriesQuery } from '@/api/reference'
import { type Country } from '@/api/types'
import { useLocalized } from '@/hooks/use-localized'
import { Button } from '@/components/ui/button'
import { ActiveBadge } from '@/components/active-badge'
import {
  DataTable,
  DataTableColumnHeader,
  RowActions,
} from '@/components/data-table'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { PageHeading } from '@/components/layout/page-heading'
import { CountryDialog } from './country-dialog'

type DialogState = { country?: Country } | null

export function Countries() {
  const { t } = useTranslation()
  const localized = useLocalized()
  const { data, isLoading } = useQuery(countriesQuery())
  const [dialog, setDialog] = useState<DialogState>(null)

  const columns: ColumnDef<Country>[] = [
    {
      accessorKey: 'code',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('countries.code')} />
      ),
      meta: { label: t('countries.code'), className: 'w-24' },
      cell: ({ row }) => <span className='font-mono'>{row.original.code}</span>,
    },
    {
      id: 'name',
      accessorFn: (c) => localized(c.name),
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('countries.name')} />
      ),
      meta: { label: t('countries.name') },
    },
    {
      id: 'is_active',
      accessorFn: (c) => String(c.is_active),
      header: t('common.status'),
      meta: { label: t('common.status') },
      cell: ({ row }) => <ActiveBadge active={row.original.is_active} />,
    },
    {
      id: 'actions',
      meta: { className: 'w-12' },
      cell: ({ row }) => (
        <RowActions
          actions={[
            {
              label: t('common.edit'),
              icon: Pencil,
              onSelect: () => setDialog({ country: row.original }),
            },
          ]}
        />
      ),
    },
  ]

  return (
    <>
      <AppHeader />
      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <PageHeading
          title={t('nav.sections.countries')}
          description={t('countries.description')}
        >
          <Button onClick={() => setDialog({})}>
            <Plus /> {t('countries.add')}
          </Button>
        </PageHeading>
        <DataTable
          columns={columns}
          data={data}
          isLoading={isLoading}
          searchPlaceholder={t('countries.search')}
        />
      </Main>
      {dialog && (
        <CountryDialog
          country={dialog.country}
          onClose={() => setDialog(null)}
        />
      )}
    </>
  )
}
