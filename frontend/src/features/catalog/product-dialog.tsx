import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { type ProductPayload, productsApi, productsQuery } from '@/api/catalog'
import { type Product } from '@/api/types'
import { applyServerErrors } from '@/lib/form-errors'
import { localizedTextSchema, positiveNumber } from '@/lib/validation'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { FormDialog } from '@/components/form-dialog'
import { TextField } from '@/components/form-fields'
import { LocalizedFields } from '@/components/localized-fields'

const optionalText = z.object({
  ru: z.string().trim(),
  uz: z.string().trim(),
  en: z.string().trim(),
})

const schema = z.object({
  name: localizedTextSchema(),
  description: optionalText,
  price: positiveNumber(),
  weight_kg: positiveNumber(),
  length_cm: positiveNumber(),
  width_cm: positiveNumber(),
  height_cm: positiveNumber(),
  is_active: z.boolean(),
})

type FormValues = z.infer<typeof schema>
const NUMBERS = [
  'price',
  'weight_kg',
  'length_cm',
  'width_cm',
  'height_cm',
] as const

export function ProductDialog({
  product,
  warehouseId,
  onClose,
}: {
  product?: Product
  warehouseId: number
  onClose: () => void
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [photo, setPhoto] = useState<File | null>(null)
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: product?.name ?? { ru: '', uz: '', en: '' },
      description: product?.description ?? { ru: '', uz: '', en: '' },
      is_active: product?.is_active ?? true,
      ...Object.fromEntries(
        NUMBERS.map((k) => [k, product ? String(product[k]) : ''])
      ),
    } as FormValues,
  })

  const save = useMutation({
    mutationFn: async (v: FormValues) => {
      const data: ProductPayload = {
        name: v.name,
        description: v.description,
        is_active: v.is_active,
        price: Number(v.price),
        weight_kg: Number(v.weight_kg),
        length_cm: Number(v.length_cm),
        width_cm: Number(v.width_cm),
        height_cm: Number(v.height_cm),
        warehouse_id: warehouseId,
      }
      const saved = product
        ? await productsApi.update(product.id, data)
        : await productsApi.create(data)
      if (photo) await productsApi.uploadPhoto(saved.id, photo)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: productsQuery(warehouseId).queryKey,
      })
      toast.success(t(product ? 'common.saved' : 'common.created'))
      onClose()
    },
    onError: (error) => applyServerErrors(error, form),
  })

  return (
    <FormDialog
      open
      onOpenChange={onClose}
      title={t(product ? 'catalog.edit' : 'catalog.add')}
      formId='product-form'
      isPending={save.isPending}
    >
      <Form {...form}>
        <form
          id='product-form'
          onSubmit={form.handleSubmit((v) => save.mutate(v))}
          className='grid gap-4'
        >
          <LocalizedFields
            control={form.control}
            name='name'
            label={t('catalog.name')}
          />
          <LocalizedFields
            control={form.control}
            name='description'
            label={t('catalog.descriptionField')}
          />
          <div className='grid gap-4 sm:grid-cols-2'>
            <TextField
              control={form.control}
              name='price'
              label={t('catalog.price')}
              numeric
            />
            <TextField
              control={form.control}
              name='weight_kg'
              label={t('catalog.weight')}
              numeric
            />
          </div>
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
          <div className='grid gap-2'>
            <Label htmlFor='product-photo'>{t('catalog.photo')}</Label>
            <Input
              id='product-photo'
              type='file'
              accept='image/*'
              onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
            />
          </div>
          <FormField
            control={form.control}
            name='is_active'
            render={({ field }) => (
              <FormItem className='flex items-center gap-3'>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel>{t('catalog.visible')}</FormLabel>
              </FormItem>
            )}
          />
        </form>
      </Form>
    </FormDialog>
  )
}
