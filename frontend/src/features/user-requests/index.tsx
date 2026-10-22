import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type ColumnDef } from '@tanstack/react-table'
import { Check, Plus, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { userRequestsApi, userRequestsQuery } from '@/api/staff'
import { type UserRequest, type UserRequestStatus } from '@/api/types'
import { formatDateTime } from '@/lib/format'
import { useCurrentUser } from '@/hooks/use-current-user'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { NewRequestDialog, RejectDialog } from './request-dialogs'

const STATUS_VARIANT = {
  pending: 'default',
  approved: 'secondary',
  rejected: 'destructive',
} as const satisfies Record<UserRequestStatus, string>

type DialogState =
  | { type: 'new' }
  | { type: 'approve' | 'reject'; request: UserRequest }
  | null

/**
 * super_admin: reviews requests from all warehouses (approve / reject).
 * admin: sees own requests and creates new ones.
 */
export function UserRequests() {
  const { t } = useTranslation()
  const user = useCurrentUser()
  const isReviewer = user.role === 'super_admin'
  const { data, isLoading } = useQuery(userRequestsQuery())
  const [dialog, setDialog] = useState<DialogState>(null)
  const queryClient = useQueryClient()
  const approve = useMutation({
    mutationFn: (request: UserRequest) => userRequestsApi.approve(request.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userRequestsQuery().queryKey })
      toast.success(t('userRequests.approvedToast'))
      setDialog(null)
    },
  })

  const columns: ColumnDef<UserRequest>[] = [
    {
      id: 'full_name',
      accessorFn: (r) => `${r.full_name} ${r.username}`,
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
    ...(isReviewer
      ? ([
          {
            id: 'warehouse',
            accessorFn: (r) => r.warehouse.name,
            header: t('staff.warehouse'),
            meta: { label: t('staff.warehouse') },
            cell: ({ row }) => (
              <div className='text-sm'>
                <div>{row.original.warehouse.name}</div>
                <div className='text-muted-foreground'>
                  {row.original.requested_by.full_name}
                </div>
              </div>
            ),
          },
        ] satisfies ColumnDef<UserRequest>[])
      : []),
    {
      accessorKey: 'created_at',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('userRequests.createdAt')}
        />
      ),
      meta: { label: t('userRequests.createdAt') },
      cell: ({ row }) => formatDateTime(row.original.created_at),
    },
    {
      accessorKey: 'status',
      header: t('common.status'),
      meta: { label: t('common.status') },
      filterFn: inSelected,
      cell: ({ row }) => {
        const r = row.original
        return (
          <div className='space-y-1 text-sm'>
            <Badge variant={STATUS_VARIANT[r.status]}>
              {t(`userRequests.status.${r.status}`)}
            </Badge>
            {r.reviewed_by && (
              <div className='text-xs text-muted-foreground'>
                {r.reviewed_by.full_name}, {formatDateTime(r.reviewed_at)}
              </div>
            )}
            {r.reject_reason && (
              <div className='max-w-64 text-xs whitespace-normal'>
                {r.reject_reason}
              </div>
            )}
          </div>
        )
      },
    },
    ...(isReviewer
      ? ([
          {
            id: 'actions',
            meta: { className: 'w-12' },
            cell: ({ row }) => (
              <RowActions
                actions={[
                  {
                    label: t('userRequests.approve'),
                    icon: Check,
                    hidden: row.original.status !== 'pending',
                    onSelect: () =>
                      setDialog({ type: 'approve', request: row.original }),
                  },
                  {
                    label: t('userRequests.reject'),
                    icon: X,
                    destructive: true,
                    hidden: row.original.status !== 'pending',
                    onSelect: () =>
                      setDialog({ type: 'reject', request: row.original }),
                  },
                ]}
              />
            ),
          },
        ] satisfies ColumnDef<UserRequest>[])
      : []),
  ]

  return (
    <>
      <AppHeader />
      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <PageHeading
          title={t('nav.sections.user_requests')}
          description={t(
            isReviewer
              ? 'userRequests.description'
              : 'userRequests.descriptionAdmin'
          )}
        >
          {!isReviewer && (
            <Button onClick={() => setDialog({ type: 'new' })}>
              <Plus /> {t('userRequests.add')}
            </Button>
          )}
        </PageHeading>
        <DataTable
          columns={columns}
          data={data}
          isLoading={isLoading}
          searchPlaceholder={t('staff.search')}
          filters={[
            {
              columnId: 'status',
              title: t('common.status'),
              options: (['pending', 'approved', 'rejected'] as const).map(
                (s) => ({ value: s, label: t(`userRequests.status.${s}`) })
              ),
            },
          ]}
        />
      </Main>

      {dialog?.type === 'new' && (
        <NewRequestDialog onClose={() => setDialog(null)} />
      )}
      {dialog?.type === 'reject' && (
        <RejectDialog
          request={dialog.request}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.type === 'approve' && (
        <ConfirmDialog
          open
          onOpenChange={() => setDialog(null)}
          title={t('userRequests.approve')}
          desc={t('userRequests.approveConfirm', {
            name: dialog.request.full_name,
            username: dialog.request.username,
            warehouse: dialog.request.warehouse.name,
          })}
          confirmText={t('userRequests.approve')}
          isLoading={approve.isPending}
          handleConfirm={() => approve.mutate(dialog.request)}
        />
      )}
    </>
  )
}
