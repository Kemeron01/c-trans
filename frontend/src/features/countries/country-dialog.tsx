import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { countriesApi, countriesQuery } from '@/api/reference'
import { type Country } from '@/api/types'
import { applyServerErrors } from '@/lib/form-errors'
import { localizedTextSchema } from '@/lib/validation'
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
import { LocalizedFields } from '@/components/localized-fields'

const schema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^[a-zA-Z]{2}$/, 'validation.countryCode'),
  name: localizedTextSchema(),
  is_active: z.boolean(),
})

type FormValues = z.infer<typeof schema>

type CountryDialogProps = {
  /** Edit this country; create a new one when undefined. */
  country?: Country
  onClose: () => void
}

export function CountryDialog({ country, onClose }: CountryDialogProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: country ?? {
      code: '',
      name: { ru: '', uz: '', en: '' },
      is_active: true,
    },
  })

  const save = useMutation({
    mutationFn: (values: FormValues) => {
      const data = { ...values, code: values.code.toUpperCase() }
      return country
        ? countriesApi.update(country.id, data)
        : countriesApi.create(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: countriesQuery().queryKey })
      toast.success(t(country ? 'common.saved' : 'common.created'))
      onClose()
    },
    onError: (error) => applyServerErrors(error, form),
  })

  return (
    <FormDialog
      open
      onOpenChange={onClose}
      title={t(country ? 'countries.edit' : 'countries.add')}
      formId='country-form'
      isPending={save.isPending}
    >
      <Form {...form}>
        <form
          id='country-form'
          onSubmit={form.handleSubmit((v) => save.mutate(v))}
          className='grid gap-4'
        >
          <FormField
            control={form.control}
            name='code'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('countries.code')}</FormLabel>
                <FormControl>
                  <Input className='w-24 uppercase' maxLength={2} {...field} />
                </FormControl>
                <FormDescription>{t('countries.codeHint')}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <LocalizedFields
            control={form.control}
            name='name'
            label={t('countries.name')}
          />
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
