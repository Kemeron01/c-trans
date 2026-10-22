import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { type ColumnDef } from '@tanstack/react-table'
import { Check, PhoneCall, PhoneOff, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ordersApi, ordersQuery, type LeadPayload } from '@/api/orders'
import { type Order } from '@/api/types'
import { applyServerErrors } from '@/lib/form-errors'
import { formatDateTime, formatNumber, formatUsd } from '@/lib/format'
import { LEAD_STATUSES } from '@/lib/order-flow'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { DataTable, inSelected } from '@/components/data-table'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { PageHeading } from '@/components/layout/page-heading'
import { OrderStatusBadge } from '../orders/order-status-badge'
import { useOrderSaved } from '../orders/use-order-saved'

const OPEN = ['lead_new', 'lead_negotiation']

/** Delivery requests being agreed with the client (requirements 5.2). */
export function Leads() {
  const { t } = useTranslation()
  const { data, isLoading } = useQuery(ordersQuery())
  const leads = data?.filter(
    (o) =>
      o.type === 'delivery' &&
      (LEAD_STATUSES.includes(o.status) || o.lead?.result)
  )
  const [selected, setSelected] = useState<Order | null>(null)

  const columns: ColumnDef<Order>[] = [
    {
      id: 'number',
      accessorFn: (o) =>
        [
          o.number,
          o.client.client_code,
          o.client.full_name,
          o.client.phone,
          ...(o.cargo?.tracking_numbers ?? []),
        ].join(' '),
      header: t('orders.number'),
      cell: ({ row }) => (
        <div>
          <Link
            to='/admin/orders/$orderId'
            params={{ orderId: String(row.original.id) }}
            className='font-medium underline-offset-4 hover:underline'
          >
            {row.original.number}
          </Link>
          <div className='text-xs text-muted-foreground'>
            {formatDateTime(row.original.created_at)}
          </div>
        </div>
      ),
    },
    {
      id: 'client',
      header: t('orders.client'),
      cell: ({ row }) => (
        <div className='text-sm'>
          <div>{row.original.client.full_name}</div>
          <div className='text-muted-foreground'>
            {row.original.client.phone}
          </div>
          <div className='font-mono text-xs text-muted-foreground'>
            {row.original.client.client_code}
          </div>
        </div>
      ),
    },
    {
      id: 'cargo',
      header: t('orders.cargo'),
      cell: ({ row }) => {
        const o = row.original
        return (
          <div className='max-w-64 text-sm whitespace-normal'>
            <div>{o.cargo?.description}</div>
            <div className='text-xs text-muted-foreground'>
              {formatNumber(o.cargo?.declared.weight_kg ?? 0)} {t('dims.kg')} ·{' '}
              {t(`method.${o.method}`)} ·{' '}
              {t(`receiveMethod.${o.receive_method}`)}
            </div>
          </div>
        )
      },
    },
    {
      id: 'price',
      header: t('leads.preliminaryPrice'),
      cell: ({ row }) => formatUsd(row.original.amounts.total_usd),
    },
    {
      accessorKey: 'status',
      header: t('common.status'),
      filterFn: inSelected,
      cell: ({ row }) => {
        const o = row.original
        return (
          <div className='grid justify-items-start gap-1'>
            <OrderStatusBadge status={o.status} />
            {LEAD_STATUSES.includes(o.status) && (
              <span className='text-xs text-muted-foreground'>
                {t(
                  o.lead?.contacted ? 'leads.contacted' : 'leads.notContacted'
                )}
              </span>
            )}
            {o.lead?.comment && (
              <span className='max-w-56 text-xs whitespace-normal'>
                {o.lead.comment}
              </span>
            )}
          </div>
        )
      },
    },
    {
      id: 'actions',
      cell: ({ row }) =>
        OPEN.includes(row.original.status) && (
          <Button
            size='sm'
            variant='outline'
            onClick={() => setSelected(row.original)}
          >
            {t('leads.process')}
          </Button>
        ),
    },
  ]

  return (
    <>
      <AppHeader />
      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <PageHeading
          title={t('nav.sections.leads')}
          description={t('leads.description')}
        />
        <DataTable
          columns={columns}
          data={leads}
          isLoading={isLoading}
          searchPlaceholder={t('orders.search')}
          initialColumnFilters={[{ id: 'status', value: OPEN }]}
          filters={[
            {
              columnId: 'status',
              title: t('common.status'),
              options: [...LEAD_STATUSES, 'awaiting_arrival' as const].map(
                (s) => ({
                  value: s,
                  label: t(`orderStatus.${s}`),
                })
              ),
            },
          ]}
        />
      </Main>
      {selected && (
        <LeadDialog order={selected} onClose={() => setSelected(null)} />
      )}
    </>
  )
}

const schema = z.object({ contacted: z.boolean(), comment: z.string() })
type Values = z.infer<typeof schema>

function LeadDialog({ order, onClose }: { order: Order; onClose: () => void }) {
  const { t } = useTranslation()
  const saved = useOrderSaved()
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      contacted: order.lead?.contacted ?? false,
      comment: order.lead?.comment ?? '',
    },
  })
  const update = useMutation({
    mutationFn: (payload: LeadPayload) =>
      ordersApi.updateLead(order.id, payload),
    onSuccess: (_, payload) => {
      saved()
      toast.success(
        t(
          payload.result === 'agreed'
            ? 'leads.agreedToast'
            : payload.result === 'rejected'
              ? 'leads.rejectedToast'
              : 'common.saved'
        )
      )
      onClose()
    },
    onError: (error) => applyServerErrors(error, form),
  })
  const submit = (result?: LeadPayload['result']) =>
    form.handleSubmit((v) => update.mutate({ ...v, result }))()

  return (
    <Dialog open onOpenChange={(v) => !v && !update.isPending && onClose()}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader className='text-start'>
          <DialogTitle>
            {t('leads.process')} · {order.number}
          </DialogTitle>
          <DialogDescription>
            {order.client.full_name} · {order.client.phone} ·{' '}
            {order.cargo?.description}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className='grid gap-4' onSubmit={(e) => e.preventDefault()}>
            <FormField
              control={form.control}
              name='contacted'
              render={({ field }) => (
                <FormItem className='flex items-center gap-3'>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className='flex items-center gap-2'>
                    {field.value ? (
                      <PhoneCall className='size-4' />
                    ) : (
                      <PhoneOff className='size-4' />
                    )}
                    {t('leads.contacted')}
                  </FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='comment'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('leads.comment')}</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter className='gap-2 sm:justify-between'>
          <Button
            variant='outline'
            disabled={update.isPending}
            onClick={() => submit()}
          >
            {t('common.save')}
          </Button>
          <div className='flex gap-2'>
            <Button
              variant='destructive'
              disabled={update.isPending}
              onClick={() => submit('rejected')}
            >
              <X /> {t('leads.reject')}
            </Button>
            <Button
              disabled={update.isPending}
              onClick={() => submit('agreed')}
            >
              <Check /> {t('leads.agree')}
            </Button>
          </div>
        </DialogFooter>
        <p className='text-xs text-muted-foreground'>{t('leads.agreeHint')}</p>
      </DialogContent>
    </Dialog>
  )
}
