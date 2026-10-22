import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  movementsQuery,
  productsApi,
  productsQuery,
  type StockMovementPayload,
} from '@/api/catalog'
import { type Product } from '@/api/types'
import { applyServerErrors } from '@/lib/form-errors'
import { formatDateTime } from '@/lib/format'
import { integerNumber, requiredString } from '@/lib/validation'
import { useLocalized } from '@/hooks/use-localized'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Form } from '@/components/ui/form'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FormDialog } from '@/components/form-dialog'
import { TextField } from '@/components/form-fields'

type ManualKind = StockMovementPayload['kind']

const schema = z.object({
  quantity: integerNumber().refine(
    (v) => Number(v) !== 0,
    'validation.nonZero'
  ),
  reason: requiredString(),
})

/** Receipt / write-off / adjustment of a product's stock. */
export function StockDialog({
  product,
  kind,
  onClose,
}: {
  product: Product
  kind: ManualKind
  onClose: () => void
}) {
  const { t } = useTranslation()
  const localized = useLocalized()
  const queryClient = useQueryClient()
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { quantity: '', reason: '' },
  })

  const save = useMutation({
    mutationFn: (v: z.infer<typeof schema>) =>
      productsApi.addMovement(product.id, {
        kind,
        quantity: Number(v.quantity),
        reason: v.reason,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: productsQuery(product.warehouse_id).queryKey,
      })
      queryClient.invalidateQueries({
        queryKey: movementsQuery(product.id).queryKey,
      })
      toast.success(t('common.saved'))
      onClose()
    },
    onError: (error) => applyServerErrors(error, form),
  })

  return (
    <FormDialog
      open
      onOpenChange={onClose}
      title={t(`catalog.movement.${kind}`)}
      description={`${localized(product.name)} · ${t('catalog.inStock')}: ${product.stock.quantity}`}
      formId='stock-form'
      isPending={save.isPending}
    >
      <Form {...form}>
        <form
          id='stock-form'
          onSubmit={form.handleSubmit((v) => save.mutate(v))}
          className='grid gap-4'
        >
          <TextField
            control={form.control}
            name='quantity'
            label={t('catalog.quantity')}
            description={
              kind === 'adjustment' ? t('catalog.adjustmentHint') : undefined
            }
            numeric
          />
          <TextField
            control={form.control}
            name='reason'
            label={t('catalog.reason')}
          />
        </form>
      </Form>
    </FormDialog>
  )
}

export function MovementsDialog({
  product,
  onClose,
}: {
  product: Product
  onClose: () => void
}) {
  const { t } = useTranslation()
  const localized = useLocalized()
  const { data } = useQuery(movementsQuery(product.id))
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className='sm:max-w-2xl'>
        <DialogHeader className='text-start'>
          <DialogTitle>{t('catalog.history')}</DialogTitle>
          <DialogDescription>{localized(product.name)}</DialogDescription>
        </DialogHeader>
        <div className='max-h-[60vh] overflow-y-auto'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('catalog.date')}</TableHead>
                <TableHead>{t('catalog.operation')}</TableHead>
                <TableHead className='text-end'>
                  {t('catalog.quantity')}
                </TableHead>
                <TableHead>{t('catalog.reason')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className='whitespace-nowrap'>
                    {formatDateTime(m.created_at)}
                    <div className='text-xs text-muted-foreground'>
                      {m.created_by.full_name}
                    </div>
                  </TableCell>
                  <TableCell>{t(`catalog.movement.${m.kind}`)}</TableCell>
                  <TableCell className='text-end font-mono'>
                    {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                  </TableCell>
                  <TableCell className='whitespace-normal'>
                    {m.reason}
                  </TableCell>
                </TableRow>
              ))}
              {data && !data.length && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className='h-16 text-center text-muted-foreground'
                  >
                    {t('dataTable.noResults')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  )
}
