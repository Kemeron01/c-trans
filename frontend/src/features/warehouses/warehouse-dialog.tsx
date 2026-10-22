import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { countriesQuery, warehousesApi, warehousesQuery } from '@/api/reference'
import { type Warehouse } from '@/api/types'
import { applyServerErrors } from '@/lib/form-errors'
import { requiredString } from '@/lib/validation'
import { useLocalized } from '@/hooks/use-localized'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { FormDialog } from '@/components/form-dialog'
import { SelectDropdown } from '@/components/select-dropdown'

const coordinate = (limit: number, message: string) =>
  z
    .string()
    .trim()
    .refine((v) => v === '' || Math.abs(Number(v)) <= limit, message)

const schema = z.object({
  name: requiredString(),
  kind: z.enum(['foreign', 'local'], 'validation.required'),
  country_id: requiredString(),
  city: requiredString(),
  address: requiredString(),
  latitude: coordinate(90, 'validation.latitude'),
  longitude: coordinate(180, 'validation.longitude'),
  is_active: z.boolean(),
})

type FormValues = z.infer<typeof schema>

const toNumber = (v: string) => (v === '' ? null : Number(v))
const toText = (v: number | null) => (v === null ? '' : String(v))

type WarehouseDialogProps = {
  warehouse?: Warehouse
  onClose: () => void
}

export function WarehouseDialog({ warehouse, onClose }: WarehouseDialogProps) {
  const { t } = useTranslation()
  const localized = useLocalized()
  const queryClient = useQueryClient()
  const countries = useQuery(countriesQuery())

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: warehouse
      ? {
          ...warehouse,
          country_id: String(warehouse.country_id),
          latitude: toText(warehouse.latitude),
          longitude: toText(warehouse.longitude),
        }
      : {
          name: '',
          kind: 'foreign',
          country_id: '',
          city: '',
          address: '',
          latitude: '',
          longitude: '',
          is_active: true,
        },
  })

  const save = useMutation({
    mutationFn: (values: FormValues) => {
      const data = {
        ...values,
        country_id: Number(values.country_id),
        latitude: toNumber(values.latitude),
        longitude: toNumber(values.longitude),
      }
      return warehouse
        ? warehousesApi.update(warehouse.id, data)
        : warehousesApi.create(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warehousesQuery().queryKey })
      toast.success(t(warehouse ? 'common.saved' : 'common.created'))
      onClose()
    },
    onError: (error) => applyServerErrors(error, form),
  })

  const text = (name: 'name' | 'city' | 'address', label: string) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )

  const coord = (name: 'latitude' | 'longitude', label: string) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input inputMode='decimal' placeholder='41.2995' {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )

  return (
    <FormDialog
      open
      onOpenChange={onClose}
      title={t(warehouse ? 'warehouses.edit' : 'warehouses.add')}
      formId='warehouse-form'
      isPending={save.isPending}
    >
      <Form {...form}>
        <form
          id='warehouse-form'
          onSubmit={form.handleSubmit((v) => save.mutate(v))}
          className='grid gap-4'
        >
          {text('name', t('warehouses.name'))}
          <div className='grid gap-4 sm:grid-cols-2'>
            <FormField
              control={form.control}
              name='kind'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('warehouses.kind')}</FormLabel>
                  <SelectDropdown
                    isControlled
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                    disabled={!!warehouse}
                    className='w-full'
                    items={[
                      { value: 'foreign', label: t('warehouseKind.foreign') },
                      { value: 'local', label: t('warehouseKind.local') },
                    ]}
                  />
                  {warehouse && (
                    <FormDescription>
                      {t('warehouses.kindLocked')}
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='country_id'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('warehouses.country')}</FormLabel>
                  <SelectDropdown
                    isControlled
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                    isPending={countries.isLoading}
                    className='w-full'
                    items={countries.data
                      ?.filter(
                        (c) => c.is_active || String(c.id) === field.value
                      )
                      .map((c) => ({
                        value: String(c.id),
                        label: localized(c.name),
                      }))}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          {text('city', t('warehouses.city'))}
          {text('address', t('warehouses.address'))}
          <div className='grid gap-4 sm:grid-cols-2'>
            {coord('latitude', t('warehouses.latitude'))}
            {coord('longitude', t('warehouses.longitude'))}
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
                <FormLabel>{t('common.active')}</FormLabel>
              </FormItem>
            )}
          />
        </form>
      </Form>
    </FormDialog>
  )
}
