import { useForm, useWatch } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { rateQuery, settingsQuery, tariffsQuery } from '@/api/setup'
import { type DeliveryMethod } from '@/api/types'
import { formatNumber, formatUsd, formatUzs } from '@/lib/format'
import { quoteDelivery, toUzs } from '@/lib/pricing'
import { useWarehouseScope } from '@/hooks/use-warehouse-scope'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormItem, FormLabel } from '@/components/ui/form'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TextField } from '@/components/form-fields'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'
import { PageHeading } from '@/components/layout/page-heading'

type Values = {
  method: DeliveryMethod
  weight_kg: string
  length_cm: string
  width_cm: string
  height_cm: string
}

const positive = (v: string) => Number(v) > 0

/** Delivery cost preview (requirements 4.4), computed as you type. */
export function Calculator() {
  const { t } = useTranslation()
  const { warehouseId, picker } = useWarehouseScope('foreign')
  const id = warehouseId ?? 0
  const settings = useQuery({ ...settingsQuery(id), enabled: !!warehouseId })
  const tariffs = useQuery({ ...tariffsQuery(id), enabled: !!warehouseId })
  const rate = useQuery(rateQuery())

  const form = useForm<Values>({
    defaultValues: {
      method: 'auto',
      weight_kg: '',
      length_cm: '',
      width_cm: '',
      height_cm: '',
    },
  })
  const v = useWatch({ control: form.control }) as Values

  const filled =
    positive(v.weight_kg) &&
    positive(v.length_cm) &&
    positive(v.width_cm) &&
    positive(v.height_cm)
  const quote =
    filled && settings.data && tariffs.data
      ? quoteDelivery({
          dimensions: {
            weight_kg: Number(v.weight_kg),
            length_cm: Number(v.length_cm),
            width_cm: Number(v.width_cm),
            height_cm: Number(v.height_cm),
          },
          method: v.method,
          settings: settings.data,
          tariffs: tariffs.data,
        })
      : null

  const kg = (n: number) => `${formatNumber(n)} ${t('dims.kg')}`

  return (
    <>
      <AppHeader />
      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <PageHeading
          title={t('nav.sections.calculator')}
          description={t('calculator.description')}
        >
          {picker}
        </PageHeading>
        <div className='grid items-start gap-4 lg:grid-cols-2'>
          <Card>
            <CardHeader>
              <CardTitle>{t('calculator.cargo')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  className='grid gap-4'
                  onSubmit={(e) => e.preventDefault()}
                >
                  <FormItem>
                    <FormLabel>{t('orders.method')}</FormLabel>
                    <Tabs
                      value={v.method}
                      onValueChange={(m) =>
                        form.setValue('method', m as DeliveryMethod)
                      }
                    >
                      <TabsList>
                        <TabsTrigger value='auto'>
                          {t('method.auto')}
                        </TabsTrigger>
                        <TabsTrigger value='avia'>
                          {t('method.avia')}
                        </TabsTrigger>
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
                    <dd className='font-medium'>
                      {kg(quote.chargeable_weight)}
                    </dd>
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
                        {rate.data
                          ? `${formatUzs(toUzs(quote.delivery_usd, rate.data.rate))} · ${t('calculator.rate', { rate: formatNumber(rate.data.rate) })}`
                          : '—'}
                      </div>
                    </div>
                  )}
                  {quote.below_minimum && (
                    <Alert variant='destructive'>
                      <AlertTriangle />
                      <AlertDescription>
                        {t('calculator.belowMinimum', {
                          min: kg(settings.data!.min_weight_kg),
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
      </Main>
    </>
  )
}
