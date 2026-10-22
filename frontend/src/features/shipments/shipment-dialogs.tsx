import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { shipmentsApi } from '@/api/shipments'
import { type Order, type Shipment } from '@/api/types'
import { applyServerErrors } from '@/lib/form-errors'
import { localizedTextSchema, requiredString } from '@/lib/validation'
import { Checkbox } from '@/components/ui/checkbox'
import { Form } from '@/components/ui/form'
import { FormDialog } from '@/components/form-dialog'
import { TextField } from '@/components/form-fields'
import { LocalizedFields } from '@/components/localized-fields'
import { useShipmentSaved } from './use-shipment-saved'

/** Orders that can join: ready to ship, same origin, destination and method. */
export function AddOrdersDialog({
  shipment,
  orders,
  onClose,
}: {
  shipment: Shipment
  orders: Order[]
  onClose: () => void
}) {
  const { t } = useTranslation()
  const saved = useShipmentSaved()
  const [picked, setPicked] = useState<number[]>([])
  const eligible = orders.filter(
    (o) =>
      o.status === 'ready_to_ship' &&
      !o.shipment &&
      o.method === shipment.method &&
      o.origin_warehouse.id === shipment.origin_warehouse.id &&
      o.destination_warehouse.id === shipment.destination_warehouse.id
  )
  const add = useMutation({
    mutationFn: () => shipmentsApi.addOrders(shipment.id, picked),
    onSuccess: () => {
      saved()
      toast.success(t('shipments.ordersAdded', { count: picked.length }))
      onClose()
    },
  })

  return (
    <FormDialog
      open
      onOpenChange={onClose}
      title={t('shipments.addOrders')}
      description={t('shipments.addOrdersHint')}
      formId='add-orders-form'
      submitText={t('shipments.addOrders')}
      isPending={add.isPending}
    >
      <form
        id='add-orders-form'
        onSubmit={(e) => {
          e.preventDefault()
          if (picked.length) add.mutate()
        }}
        className='grid gap-2'
      >
        {eligible.map((o) => (
          <label
            key={o.id}
            className='flex items-center gap-3 rounded-md border p-3 text-sm'
          >
            <Checkbox
              checked={picked.includes(o.id)}
              onCheckedChange={(on) =>
                setPicked((p) =>
                  on ? [...p, o.id] : p.filter((x) => x !== o.id)
                )
              }
            />
            <span className='font-medium'>{o.number}</span>
            <span className='text-muted-foreground'>
              {o.client.full_name} · {t(`orderType.${o.type}`)}
            </span>
          </label>
        ))}
        {!eligible.length && (
          <p className='text-sm text-muted-foreground'>
            {t('shipments.noEligible')}
          </p>
        )}
      </form>
    </FormDialog>
  )
}

const checkpointSchema = z.object({
  name: localizedTextSchema(),
  latitude: requiredString().refine(
    (v) => Math.abs(Number(v)) <= 90 && v !== '' && !isNaN(Number(v)),
    'validation.latitude'
  ),
  longitude: requiredString().refine(
    (v) => Math.abs(Number(v)) <= 180 && v !== '' && !isNaN(Number(v)),
    'validation.longitude'
  ),
  at: requiredString(),
})
type CheckpointValues = z.infer<typeof checkpointSchema>

/** Local "now" for <input type="datetime-local">. */
const nowLocal = () => {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

/** Manual checkpoint for the whole shipment (requirements 6, v1). */
export function CheckpointDialog({
  shipment,
  onClose,
}: {
  shipment: Shipment
  onClose: () => void
}) {
  const { t } = useTranslation()
  const saved = useShipmentSaved()
  const form = useForm<CheckpointValues>({
    resolver: zodResolver(checkpointSchema),
    defaultValues: {
      name: { ru: '', uz: '', en: '' },
      latitude: '',
      longitude: '',
      at: nowLocal(),
    },
  })
  const add = useMutation({
    mutationFn: (v: CheckpointValues) =>
      shipmentsApi.addCheckpoint(shipment.id, {
        name: v.name,
        latitude: Number(v.latitude),
        longitude: Number(v.longitude),
        at: new Date(v.at).toISOString(),
      }),
    onSuccess: () => {
      saved()
      toast.success(t('common.saved'))
      onClose()
    },
    onError: (error) => applyServerErrors(error, form),
  })

  return (
    <FormDialog
      open
      onOpenChange={onClose}
      title={t('shipments.addCheckpoint')}
      description={shipment.number}
      formId='checkpoint-form'
      isPending={add.isPending}
    >
      <Form {...form}>
        <form
          id='checkpoint-form'
          onSubmit={form.handleSubmit((v) => add.mutate(v))}
          className='grid gap-4'
        >
          <LocalizedFields
            control={form.control}
            name='name'
            label={t('shipments.checkpointName')}
          />
          <div className='grid gap-4 sm:grid-cols-2'>
            <TextField
              control={form.control}
              name='latitude'
              label={t('warehouses.latitude')}
              numeric
            />
            <TextField
              control={form.control}
              name='longitude'
              label={t('warehouses.longitude')}
              numeric
            />
          </div>
          <TextField
            control={form.control}
            name='at'
            label={t('shipments.checkpointTime')}
            type='datetime-local'
          />
        </form>
      </Form>
    </FormDialog>
  )
}
