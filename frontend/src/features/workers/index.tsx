import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { type ColumnDef } from '@tanstack/react-table'
import { KeyRound, Lock, LockOpen, UserPlus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { workersApi, workersQuery } from '@/api/staff'
import { type StaffAccount } from '@/api/types'
import { useCurrentUser } from '@/hooks/use-current-user'
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
import { PasswordDialog } from '../admins/password-dialog'

type DialogState = { type: 'password' | 'toggle'; worker: StaffAccount } | null

/** Admin's workers. New ones are created through a request to the super-admin. */
export function Workers() {
  const { t } = useTranslation()
  const user = useCurrentUser()
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery(workersQuery())
  const [dialog, setDialog] = useState<DialogState>(null)

  const toggle = useMutation({
    mutationFn: (w: StaffAccount) =>
      workersApi.update(w.id, { is_active: !w.is_active }),
    onSuccess: (w) => {
      queryClient.invalidateQueries({ queryKey: workersQuery().queryKey })
      toast.success(t(w.is_active ? 'staff.unblocked' : 'staff.blocked'))
      setDialog(null)
    },
  })

  const columns: ColumnDef<StaffAccount>[] = [
    {
      id: 'full_name',
      accessorFn: (w) => `${w.full_name} ${w.username}`,
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
      id: 'contacts',
      accessorFn: (w) => [w.phone, w.email].filter(Boolean).join(' '),
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
      accessorFn: (w) => String(w.is_active),
      header: t('common.status'),
      meta: { label: t('common.status') },
      filterFn: inSelected,
      cell: ({ row }) => <ActiveBadge active={row.original.is_active} />,
    },
    {
      id: 'actions',
      meta: { className: 'w-12' },
      cell: ({ row }) => {
        const worker = row.original
        return (
          <RowActions
            actions={[
              {
                label: t('staff.setPassword'),
                icon: KeyRound,
                onSelect: () => setDialog({ type: 'password', worker }),
              },
              {
                label: t(worker.is_active ? 'staff.block' : 'staff.unblock'),
                icon: worker.is_active ? Lock : LockOpen,
                destructive: worker.is_active,
                onSelect: () => setDialog({ type: 'toggle', worker }),
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
          title={t('nav.sections.workers')}
          description={t('workers.description', {
            warehouse: user.warehouse?.name ?? '',
          })}
        >
          <Button asChild variant='outline'>
            <Link to='/admin/user-requests'>
              <UserPlus /> {t('userRequests.add')}
            </Link>
          </Button>
        </PageHeading>
        <DataTable
          columns={columns}
          data={data}
          isLoading={isLoading}
          searchPlaceholder={t('staff.search')}
          filters={[
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

      {dialog?.type === 'password' && (
        <PasswordDialog
          account={dialog.worker}
          setPassword={workersApi.setPassword}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.type === 'toggle' && (
        <ConfirmDialog
          open
          onOpenChange={() => setDialog(null)}
          title={t(dialog.worker.is_active ? 'staff.block' : 'staff.unblock')}
          desc={t(
            dialog.worker.is_active
              ? 'staff.blockConfirm'
              : 'staff.unblockConfirm',
            { name: dialog.worker.full_name }
          )}
          confirmText={t(
            dialog.worker.is_active ? 'staff.block' : 'staff.unblock'
          )}
          destructive={dialog.worker.is_active}
          isLoading={toggle.isPending}
          handleConfirm={() => toggle.mutate(dialog.worker)}
        />
      )}
    </>
  )
}
