import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { type ColumnDef } from '@tanstack/react-table'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { warehousesQuery } from '@/api/reference'
import { shipmentsApi, shipmentsQuery } from '@/api/shipments'
import { type Shipment } from '@/api/types'
import { applyServerErrors } from '@/lib/form-errors'
import { formatDate, todayLocal } from '@/lib/format'
import { requiredString } from '@/lib/validation'
import { useCurrentUser } from '@/hooks/use-current-user'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { DataTable, inSelected } from '@/components/data-table'
import { FormDialog } from '@/components/form-dialog'
import { TextField } from '@/components/form-fields'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { PageHeading } from '@/components/layout/page-heading'
import { SelectDropdown } from '@/components/select-dropdown'
import { ShipmentStatusBadge } from './shipment-status-badge'

/** One truck or one flight with orders of several clients (requirements 6). */
export function Shipments() {
  const { t } = useTranslation()
  const user = useCurrentUser()
  const { data, isLoading } = useQuery(shipmentsQuery())
  const [creating, setCreating] = useState(false)
  // Only staff of a foreign warehouse form shipments
  const canCreate = user.warehouse?.kind === 'foreign'

  const columns: ColumnDef<Shipment>[] = [
    {
      accessorKey: 'number',
      header: t('shipments.number'),
      cell: ({ row }) => (
        <Link
          to='/admin/shipments/$shipmentId'
          params={{ shipmentId: String(row.original.id) }}
          className='font-medium underline-offset-4 hover:underline'
        >
          {row.original.number}
        </Link>
      ),
    },
    {
      id: 'route',
      accessorFn: (s) => s.method,
      header: t('orders.route'),
      filterFn: inSelected,
      cell: ({ row }) => {
        const s = row.original
        return (
          <div className='text-sm'>
            <div>
              {s.origin_warehouse.name} → {s.destination_warehouse.name}
            </div>
            <div className='text-xs text-muted-foreground'>
              {t(`method.${s.method}`)}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'status',
      header: t('common.status'),
      filterFn: inSelected,
      cell: ({ row }) => <ShipmentStatusBadge status={row.original.status} />,
    },
    {
      id: 'dates',
      header: t('shipments.dates'),
      cell: ({ row }) => {
        const s = row.original
        return (
          <div className='text-sm'>
            <div>
              {t('shipments.departure')}:{' '}
              {formatDate(s.departed_at ?? s.planned_departure)}
            </div>
            <div className='text-muted-foreground'>
              {t('shipments.arrival')}:{' '}
              {formatDate(s.arrived_at ?? s.planned_arrival)}
            </div>
          </div>
        )
      },
    },
    {
      id: 'orders',
      header: t('shipments.ordersCount'),
      cell: ({ row }) => row.original.order_ids.length,
    },
  ]

  return (
    <>
      <AppHeader />
      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <PageHeading
          title={t('nav.sections.shipments')}
          description={t('shipments.description')}
        >
          {canCreate && (
            <Button onClick={() => setCreating(true)}>
              <Plus /> {t('shipments.add')}
            </Button>
          )}
        </PageHeading>
        <DataTable
          columns={columns}
          data={data}
          isLoading={isLoading}
          searchPlaceholder={t('shipments.search')}
          filters={[
            {
              columnId: 'status',
              title: t('common.status'),
              options: (['forming', 'in_transit', 'arrived'] as const).map(
                (s) => ({ value: s, label: t(`shipmentStatus.${s}`) })
              ),
            },
            {
              columnId: 'route',
              title: t('orders.method'),
              options: (['auto', 'avia'] as const).map((m) => ({
                value: m,
                label: t(`method.${m}`),
              })),
            },
          ]}
        />
      </Main>
      {creating && <CreateShipmentDialog onClose={() => setCreating(false)} />}
    </>
  )
}

const schema = z
  .object({
    method: z.enum(['auto', 'avia']),
    destination_warehouse_id: requiredString(),
    planned_departure: requiredString(),
    planned_arrival: requiredString(),
  })
  .refine((v) => v.planned_arrival >= v.planned_departure, {
    path: ['planned_arrival'],
    message: 'validation.dateOrder',
  })
type Values = z.infer<typeof schema>

function CreateShipmentDialog({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const warehouses = useQuery(warehousesQuery())
  const destinations = warehouses.data?.filter(
    (w) => w.kind === 'local' && w.is_active
  )
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      method: 'auto',
      destination_warehouse_id: '',
      planned_departure: todayLocal(),
      planned_arrival: '',
    },
  })
  const create = useMutation({
    mutationFn: (v: Values) =>
      shipmentsApi.create({
        ...v,
        destination_warehouse_id: Number(v.destination_warehouse_id),
      }),
    onSuccess: (s) => {
      queryClient.invalidateQueries({ queryKey: shipmentsQuery().queryKey })
      toast.success(t('common.created'))
      navigate({
        to: '/admin/shipments/$shipmentId',
        params: { shipmentId: String(s.id) },
      })
    },
    onError: (error) => applyServerErrors(error, form),
  })

  return (
    <FormDialog
      open
      onOpenChange={onClose}
      title={t('shipments.add')}
      description={t('shipments.addHint')}
      formId='shipment-form'
      isPending={create.isPending}
    >
      <Form {...form}>
        <form
          id='shipment-form'
          onSubmit={form.handleSubmit((v) => create.mutate(v))}
          className='grid gap-4 sm:grid-cols-2'
        >
          <FormField
            control={form.control}
            name='method'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('orders.method')}</FormLabel>
                <SelectDropdown
                  isControlled
                  defaultValue={field.value}
                  onValueChange={field.onChange}
                  className='w-full'
                  items={[
                    { value: 'auto', label: t('method.auto') },
                    { value: 'avia', label: t('method.avia') },
                  ]}
                />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='destination_warehouse_id'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('shipments.destination')}</FormLabel>
                <SelectDropdown
                  isControlled
                  defaultValue={field.value}
                  onValueChange={field.onChange}
                  isPending={warehouses.isLoading}
                  className='w-full'
                  items={destinations?.map((w) => ({
                    value: String(w.id),
                    label: w.name,
                  }))}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <TextField
            control={form.control}
            name='planned_departure'
            label={t('shipments.plannedDeparture')}
            type='date'
          />
          <TextField
            control={form.control}
            name='planned_arrival'
            label={t('shipments.plannedArrival')}
            type='date'
          />
        </form>
      </Form>
    </FormDialog>
  )
}
