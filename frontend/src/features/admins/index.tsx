import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type ColumnDef } from '@tanstack/react-table'
import { KeyRound, Lock, LockOpen, Pencil, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { warehousesQuery } from '@/api/reference'
import { adminsApi, adminsQuery } from '@/api/staff'
import { type StaffAccount } from '@/api/types'
import { Button } from '@/components/ui/button'
import { ActiveBadge } from '@/components/active-badge'
import { ConfirmDialog } from '@/components/confirm-dialog'
import {
  DataTable,
  DataTableColumnHeader,
  RowActions,
  inSelected,
} from '@/components/data-table'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { PageHeading } from '@/components/layout/page-heading'
import { AdminDialog } from './admin-dialog'
import { PasswordDialog } from './password-dialog'

type DialogState =
  | { type: 'form'; admin?: StaffAccount }
  | { type: 'password' | 'toggle'; admin: StaffAccount }
  | null

export function Admins() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery(adminsQuery())
  const warehouses = useQuery(warehousesQuery()).data ?? []
  const [dialog, setDialog] = useState<DialogState>(null)

  const toggleActive = useMutation({
    mutationFn: (admin: StaffAccount) =>
      adminsApi.update(admin.id, { is_active: !admin.is_active }),
    onSuccess: (admin) => {
      queryClient.invalidateQueries({ queryKey: adminsQuery().queryKey })
      toast.success(t(admin.is_active ? 'staff.unblocked' : 'staff.blocked'))
      setDialog(null)
    },
  })

  const columns: ColumnDef<StaffAccount>[] = [
    {
      id: 'full_name',
      accessorFn: (a) => `${a.full_name} ${a.username}`,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('staff.fullName')} />
      ),
      meta: { label: t('staff.fullName') },
      cell: ({ row }) => (
        <div>
          <div className='font-medium'>{row.original.full_name}</div>
          <div className='font-mono text-xs text-muted-foreground'>
            {row.original.username}
          </div>
        </div>
      ),
    },
    {
      id: 'warehouse',
      accessorFn: (a) => String(a.warehouse?.id ?? ''),
      header: t('staff.warehouse'),
      meta: { label: t('staff.warehouse') },
      filterFn: inSelected,
      cell: ({ row }) => row.original.warehouse?.name ?? '—',
    },
    {
      id: 'contacts',
      accessorFn: (a) => [a.phone, a.email].filter(Boolean).join(' '),
      header: t('staff.contacts'),
      meta: { label: t('staff.contacts') },
      cell: ({ row }) => (
        <div className='text-sm'>
          <div>{row.original.phone ?? '—'}</div>
          <div className='text-muted-foreground'>{row.original.email}</div>
        </div>
      ),
    },
    {
      id: 'is_active',
      accessorFn: (a) => String(a.is_active),
      header: t('common.status'),
      meta: { label: t('common.status') },
      filterFn: inSelected,
      cell: ({ row }) => <ActiveBadge active={row.original.is_active} />,
    },
    {
      id: 'actions',
      meta: { className: 'w-12' },
      cell: ({ row }) => {
        const admin = row.original
        return (
          <RowActions
            actions={[
              {
                label: t('common.edit'),
                icon: Pencil,
                onSelect: () => setDialog({ type: 'form', admin }),
              },
              {
                label: t('staff.setPassword'),
                icon: KeyRound,
                onSelect: () => setDialog({ type: 'password', admin }),
              },
              {
                label: t(admin.is_active ? 'staff.block' : 'staff.unblock'),
                icon: admin.is_active ? Lock : LockOpen,
                destructive: admin.is_active,
                onSelect: () => setDialog({ type: 'toggle', admin }),
              },
            ]}
          />
        )
      },
    },
  ]

  return (
    <>
      <AppHeader />
      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <PageHeading
          title={t('nav.sections.admins')}
          description={t('admins.description')}
        >
          <Button onClick={() => setDialog({ type: 'form' })}>
            <Plus /> {t('admins.add')}
          </Button>
        </PageHeading>
        <DataTable
          columns={columns}
          data={data}
          isLoading={isLoading}
          searchPlaceholder={t('staff.search')}
          filters={[
            {
              columnId: 'warehouse',
              title: t('staff.warehouse'),
              options: warehouses.map((w) => ({
                value: String(w.id),
                label: w.name,
              })),
            },
            {
              columnId: 'is_active',
              title: t('common.status'),
              options: [
                { value: 'true', label: t('common.active') },
                { value: 'false', label: t('common.inactive') },
              ],
            },
          ]}
        />
      </Main>

      {dialog?.type === 'form' && (
        <AdminDialog admin={dialog.admin} onClose={() => setDialog(null)} />
      )}
      {dialog?.type === 'password' && (
        <PasswordDialog
          account={dialog.admin}
          setPassword={adminsApi.setPassword}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.type === 'toggle' && (
        <ConfirmDialog
          open
          onOpenChange={() => setDialog(null)}
          title={t(dialog.admin.is_active ? 'staff.block' : 'staff.unblock')}
          desc={t(
            dialog.admin.is_active
              ? 'staff.blockConfirm'
              : 'staff.unblockConfirm',
            { name: dialog.admin.full_name }
          )}
          confirmText={t(
            dialog.admin.is_active ? 'staff.block' : 'staff.unblock'
          )}
          destructive={dialog.admin.is_active}
          isLoading={toggleActive.isPending}
          handleConfirm={() => toggleActive.mutate(dialog.admin)}
        />
      )}
    </>
  )
}
