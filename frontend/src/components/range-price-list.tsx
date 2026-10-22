import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { type WeightRange } from '@/api/types'
import { applyServerErrors } from '@/lib/form-errors'
import { formatNumber, formatUsd } from '@/lib/format'
import {
  nonNegativeNumber,
  optionalPositiveNumber,
  positiveNumber,
} from '@/lib/validation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form } from '@/components/ui/form'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { RowActions } from '@/components/data-table'
import { FormDialog } from '@/components/form-dialog'
import { TextField } from '@/components/form-fields'

export type PricedRange = WeightRange & { id: number; price: number }
export type RangeValues = WeightRange & { price: number }

type RangePriceListProps = {
  title: string
  priceLabel: string
  items: PricedRange[] | undefined
  canEdit: boolean
  onCreate: (values: RangeValues) => Promise<unknown>
  onUpdate: (id: number, values: RangeValues) => Promise<unknown>
  onDelete: (id: number) => Promise<unknown>
}

const schema = z
  .object({
    weight_from: nonNegativeNumber(),
    weight_to: optionalPositiveNumber(),
    price: positiveNumber(),
  })
  .refine(
    (v) => v.weight_to === '' || Number(v.weight_to) > Number(v.weight_from),
    { path: ['weight_to'], message: 'validation.rangeOrder' }
  )

type FormValues = z.infer<typeof schema>

/** Weight-range price list: delivery tariffs and courier tariffs. */
export function RangePriceList({
  title,
  priceLabel,
  items,
  canEdit,
  onCreate,
  onUpdate,
  onDelete,
}: RangePriceListProps) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState<PricedRange | 'new' | null>(null)
  const [deleting, setDeleting] = useState<PricedRange | null>(null)
  const sorted = [...(items ?? [])].sort(
    (a, b) => a.weight_from - b.weight_from
  )

  const remove = useMutation({
    mutationFn: (id: number) => onDelete(id),
    onSuccess: () => {
      toast.success(t('common.deleted'))
      setDeleting(null)
    },
  })

  const rangeText = (r: WeightRange) =>
    r.weight_to === null
      ? t('tariffs.rangeFrom', { from: formatNumber(r.weight_from) })
      : t('tariffs.range', {
          from: formatNumber(r.weight_from),
          to: formatNumber(r.weight_to),
        })

  return (
    <Card className='gap-3'>
      <CardHeader className='flex flex-row items-center justify-between'>
        <CardTitle>{title}</CardTitle>
        {canEdit && (
          <Button size='sm' variant='outline' onClick={() => setEditing('new')}>
            <Plus /> {t('tariffs.addRange')}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('tariffs.weight')}</TableHead>
              <TableHead>{priceLabel}</TableHead>
              {canEdit && <TableHead className='w-12' />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{rangeText(r)}</TableCell>
                <TableCell>{formatUsd(r.price)}</TableCell>
                {canEdit && (
                  <TableCell>
                    <RowActions
                      actions={[
                        {
                          label: t('common.edit'),
                          icon: Pencil,
                          onSelect: () => setEditing(r),
                        },
                        {
                          label: t('common.delete'),
                          icon: Trash2,
                          destructive: true,
                          onSelect: () => setDeleting(r),
                        },
                      ]}
                    />
                  </TableCell>
                )}
              </TableRow>
            ))}
            {!sorted.length && (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className='h-16 text-center text-muted-foreground'
                >
                  {t('tariffs.empty')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      {editing && (
        <RangeDialog
          range={editing === 'new' ? undefined : editing}
          priceLabel={priceLabel}
          onSave={(values) =>
            editing === 'new' ? onCreate(values) : onUpdate(editing.id, values)
          }
          onClose={() => setEditing(null)}
        />
      )}
      {deleting && (
        <ConfirmDialog
          open
          onOpenChange={() => setDeleting(null)}
          title={t('common.delete')}
          desc={rangeText(deleting)}
          confirmText={t('common.delete')}
          destructive
          isLoading={remove.isPending}
          handleConfirm={() => remove.mutate(deleting.id)}
        />
      )}
    </Card>
  )
}

function RangeDialog({
  range,
  priceLabel,
  onSave,
  onClose,
}: {
  range?: PricedRange
  priceLabel: string
  onSave: (values: RangeValues) => Promise<unknown>
  onClose: () => void
}) {
  const { t } = useTranslation()
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      weight_from: range ? String(range.weight_from) : '',
      weight_to: range?.weight_to != null ? String(range.weight_to) : '',
      price: range ? String(range.price) : '',
    },
  })
  const save = useMutation({
    mutationFn: (v: FormValues) =>
      onSave({
        weight_from: Number(v.weight_from),
        weight_to: v.weight_to === '' ? null : Number(v.weight_to),
        price: Number(v.price),
      }),
    onSuccess: () => {
      toast.success(t('common.saved'))
      onClose()
    },
    onError: (error) => applyServerErrors(error, form),
  })

  return (
    <FormDialog
      open
      onOpenChange={onClose}
      title={t(range ? 'tariffs.editRange' : 'tariffs.addRange')}
      formId='range-form'
      isPending={save.isPending}
    >
      <Form {...form}>
        <form
          id='range-form'
          onSubmit={form.handleSubmit((v) => save.mutate(v))}
          className='grid gap-4 sm:grid-cols-2'
        >
          <TextField
            control={form.control}
            name='weight_from'
            label={t('tariffs.weightFrom')}
            numeric
          />
          <TextField
            control={form.control}
            name='weight_to'
            label={t('tariffs.weightTo')}
            description={t('tariffs.weightToHint')}
            numeric
          />
          <TextField
            control={form.control}
            name='price'
            label={priceLabel}
            numeric
          />
        </form>
      </Form>
    </FormDialog>
  )
}
