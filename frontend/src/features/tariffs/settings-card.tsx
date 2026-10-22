import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { settingsApi, settingsQuery } from '@/api/setup'
import { type WarehouseSettings } from '@/api/types'
import { applyServerErrors } from '@/lib/form-errors'
import { positiveNumber } from '@/lib/validation'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Form } from '@/components/ui/form'
import { TextField } from '@/components/form-fields'

const schema = z.object({
  min_weight_kg: positiveNumber(),
  divisor_avia: positiveNumber(),
  divisor_auto: positiveNumber(),
})

type FormValues = z.infer<typeof schema>

/** Minimum order weight and volume-weight divisors (requirements 4.1). */
export function SettingsCard({
  settings,
  canEdit,
}: {
  settings: WarehouseSettings
  canEdit: boolean
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      min_weight_kg: String(settings.min_weight_kg),
      divisor_avia: String(settings.volume_divisor.avia),
      divisor_auto: String(settings.volume_divisor.auto),
    },
  })

  const save = useMutation({
    mutationFn: (v: FormValues) =>
      settingsApi.update(settings.warehouse_id, {
        min_weight_kg: Number(v.min_weight_kg),
        volume_divisor: {
          avia: Number(v.divisor_avia),
          auto: Number(v.divisor_auto),
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: settingsQuery(settings.warehouse_id).queryKey,
      })
      toast.success(t('common.saved'))
    },
    onError: (error) => applyServerErrors(error, form),
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('tariffs.settings')}</CardTitle>
        <CardDescription>{t('tariffs.settingsHint')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) => save.mutate(v))}
            className='grid items-start gap-4 sm:grid-cols-[repeat(3,minmax(0,1fr))_auto]'
          >
            <TextField
              control={form.control}
              name='min_weight_kg'
              label={t('tariffs.minWeight')}
              disabled={!canEdit}
              numeric
            />
            <TextField
              control={form.control}
              name='divisor_avia'
              label={t('tariffs.divisorAvia')}
              disabled={!canEdit}
              numeric
            />
            <TextField
              control={form.control}
              name='divisor_auto'
              label={t('tariffs.divisorAuto')}
              disabled={!canEdit}
              numeric
            />
            {canEdit && (
              <Button
                type='submit'
                className='sm:mt-[1.375rem]'
                disabled={save.isPending || !form.formState.isDirty}
              >
                {t('common.save')}
              </Button>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
