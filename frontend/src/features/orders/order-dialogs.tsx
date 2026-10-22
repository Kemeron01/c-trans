import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ordersApi } from '@/api/orders'
import { type Order } from '@/api/types'
import { applyServerErrors } from '@/lib/form-errors'
import { formatUsd } from '@/lib/format'
import { needsRefund } from '@/lib/order-flow'
import { positiveNumber, requiredString } from '@/lib/validation'
import { Form } from '@/components/ui/form'
import { FormDialog } from '@/components/form-dialog'
import { TextField } from '@/components/form-fields'
import { useOrderSaved } from './use-order-saved'

const weighSchema = z.object({
  weight_kg: positiveNumber(),
  length_cm: positiveNumber(),
  width_cm: positiveNumber(),
  height_cm: positiveNumber(),
})
type WeighValues = z.infer<typeof weighSchema>

/** Cargo arrived: actual weight/size → exact price → automatic charge (5.2). */
export function WeighDialog({
  order,
  onClose,
}: {
  order: Order
  onClose: () => void
}) {
  const { t } = useTranslation()
  const saved = useOrderSaved()
  const declared = order.cargo!.declared
  const form = useForm<WeighValues>({
    resolver: zodResolver(weighSchema),
    defaultValues: {
      weight_kg: String(declared.weight_kg),
      length_cm: String(declared.length_cm),
      width_cm: String(declared.width_cm),
      height_cm: String(declared.height_cm),
    },
  })
  const weigh = useMutation({
    mutationFn: (v: WeighValues) =>
      ordersApi.weigh(order.id, {
        weight_kg: Number(v.weight_kg),
        length_cm: Number(v.length_cm),
        width_cm: Number(v.width_cm),
        height_cm: Number(v.height_cm),
      }),
    onSuccess: (updated) => {
      saved()
      toast.success(
        t('orders.weighed', { total: formatUsd(updated.amounts.total_usd) })
      )
      onClose()
    },
    onError: (error) => applyServerErrors(error, form),
  })

  return (
    <FormDialog
      open
      onOpenChange={onClose}
      title={t('orders.weigh')}
      description={t('orders.weighHint')}
      formId='weigh-form'
      submitText={t('orders.weighSubmit')}
      isPending={weigh.isPending}
    >
      <Form {...form}>
        <form
          id='weigh-form'
          onSubmit={form.handleSubmit((v) => weigh.mutate(v))}
          className='grid gap-4'
        >
          <TextField
            control={form.control}
            name='weight_kg'
            label={t('dims.weight')}
            numeric
            autoFocus
          />
          <div className='grid grid-cols-3 gap-4'>
            <TextField
              control={form.control}
              name='length_cm'
              label={t('dims.length')}
              numeric
            />
            <TextField
              control={form.control}
              name='width_cm'
              label={t('dims.width')}
              numeric
            />
            <TextField
              control={form.control}
              name='height_cm'
              label={t('dims.height')}
              numeric
            />
          </div>
        </form>
      </Form>
    </FormDialog>
  )
}

const cancelSchema = z.object({ reason: requiredString() })

export function CancelDialog({
  order,
  onClose,
}: {
  order: Order
  onClose: () => void
}) {
  const { t } = useTranslation()
  const saved = useOrderSaved()
  const form = useForm<z.infer<typeof cancelSchema>>({
    resolver: zodResolver(cancelSchema),
    defaultValues: { reason: '' },
  })
  const cancel = useMutation({
    mutationFn: (v: z.infer<typeof cancelSchema>) =>
      ordersApi.cancel(order.id, v.reason),
    onSuccess: () => {
      saved()
      toast.success(t('orders.cancelled'))
      onClose()
    },
    onError: (error) => applyServerErrors(error, form),
  })

  return (
    <FormDialog
      open
      onOpenChange={onClose}
      title={t('orders.cancel')}
      description={
        needsRefund(order)
          ? t('orders.cancelRefund', {
              total: formatUsd(order.amounts.total_usd),
            })
          : t('orders.cancelHint')
      }
      formId='cancel-form'
      submitText={t('orders.cancel')}
      isPending={cancel.isPending}
    >
      <Form {...form}>
        <form
          id='cancel-form'
          onSubmit={form.handleSubmit((v) => cancel.mutate(v))}
        >
          <TextField
            control={form.control}
            name='reason'
            label={t('orders.cancelReason')}
          />
        </form>
      </Form>
    </FormDialog>
  )
}
