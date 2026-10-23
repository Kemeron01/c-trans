import { useForm, useWatch } from 'react-hook-form'
import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  type DeliveryMethod,
  type Tariff,
  type WarehouseSettings,
} from '@/api/types'
import { formatNumber, formatUsd } from '@/lib/format'
import { quoteDelivery } from '@/lib/pricing'
import { useUzs } from '@/hooks/use-uzs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormItem, FormLabel } from '@/components/ui/form'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TextField } from '@/components/form-fields'

type Values = {
  method: DeliveryMethod
  weight_kg: string
  length_cm: string
  width_cm: string
  height_cm: string
}

const positive = (v: string) => Number(v) > 0

/**
 * Delivery cost preview (requirements 4.4), computed as you type. Used in
 * the admin panel and on the public site.
 */
export function DeliveryCalculator({
  settings,
  tariffs,
  methods = ['auto', 'avia'],
}: {
  settings: WarehouseSettings | null | undefined
  tariffs: Tariff[] | undefined
  /** Methods offered by the warehouse (with at least one tariff). */
  methods?: DeliveryMethod[]
}) {
  const { t } = useTranslation()
  const { uzs, rate } = useUzs()
  const form = useForm<Values>({
    defaultValues: {
      method: methods[0] ?? 'auto',
      weight_kg: '',
      length_cm: '',
      width_cm: '',
      height_cm: '',
    },
  })
  const v = useWatch({ control: form.control }) as Values
  const method = methods.includes(v.method) ? v.method : methods[0]

  const filled =
    positive(v.weight_kg) &&
    positive(v.length_cm) &&
    positive(v.width_cm) &&
    positive(v.height_cm)
  const quote =
    filled && settings && tariffs && method
      ? quoteDelivery({
          dimensions: {
            weight_kg: Number(v.weight_kg),
            length_cm: Number(v.length_cm),
            width_cm: Number(v.width_cm),
            height_cm: Number(v.height_cm),
          },
          method,
          settings,
          tariffs,
        })
      : null
  const kg = (n: number) => `${formatNumber(n)} ${t('dims.kg')}`

  return (
    <div className='grid items-start gap-4 lg:grid-cols-2'>
      <Card>
        <CardHeader>
          <CardTitle>{t('calculator.cargo')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className='grid gap-4' onSubmit={(e) => e.preventDefault()}>
              <FormItem>
                <FormLabel>{t('orders.method')}</FormLabel>
                <Tabs
                  value={method}
                  onValueChange={(m) =>
                    form.setValue('method', m as DeliveryMethod)
                  }
                >
                  <TabsList>
                    {methods.map((m) => (
                      <TabsTrigger key={m} value={m}>
                        {t(`method.${m}`)}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </FormItem>
              <TextField
                control={form.control}
                name='weight_kg'
                label={t('dims.weight')}
                numeric
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('calculator.result')}</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-4'>
          {!quote ? (
            <p className='text-muted-foreground'>{t('calculator.fill')}</p>
          ) : (
            <>
              <dl className='grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-sm'>
                <dt className='text-muted-foreground'>
                  {t('calculator.volumeWeight')}
                </dt>
                <dd>{kg(quote.volume_weight)}</dd>
                <dt className='text-muted-foreground'>
                  {t('calculator.chargeableWeight')}
                </dt>
                <dd className='font-medium'>{kg(quote.chargeable_weight)}</dd>
                <dt className='text-muted-foreground'>
                  {t('calculator.tariff')}
                </dt>
                <dd>
                  {quote.tariff
                    ? `${formatUsd(quote.tariff.price_per_kg)} / ${t('dims.kg')}`
                    : '—'}
                </dd>
              </dl>
              {quote.delivery_usd !== null && (
                <div className='rounded-lg bg-muted p-4'>
                  <div className='text-3xl font-bold'>
                    {formatUsd(quote.delivery_usd)}
                  </div>
                  <div className='text-muted-foreground'>
                    {uzs(quote.delivery_usd)}
                    {rate &&
                      ` · ${t('calculator.rate', { rate: formatNumber(rate) })}`}
                  </div>
                </div>
              )}
              {quote.below_minimum && settings && (
                <Alert variant='destructive'>
                  <AlertTriangle />
                  <AlertDescription>
                    {t('calculator.belowMinimum', {
                      min: kg(settings.min_weight_kg),
                    })}
                  </AlertDescription>
                </Alert>
              )}
              {!quote.tariff && (
                <Alert variant='destructive'>
                  <AlertTriangle />
                  <AlertDescription>
                    {t('calculator.noTariff')}
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
