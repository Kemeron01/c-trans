import { useState } from 'react'
import { z } from 'zod'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  cardsQuery,
  clientApi,
  clientOrdersQuery,
  profileQuery,
  publicWarehousesQuery,
} from '@/api/account'
import { applyServerErrors } from '@/lib/form-errors'
import { positiveNumber, requiredString } from '@/lib/validation'
import { useLocalized } from '@/hooks/use-localized'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { TextField } from '@/components/form-fields'
import {
  DeliveryOptions,
  type DeliveryChoice,
  QuoteSummary,
} from './delivery-options'
import { useDestination, useOrderQuote } from './use-order-quote'

const schema = z.object({
  description: requiredString(),
  tracking: requiredString(),
  weight_kg: positiveNumber(),
  length_cm: positiveNumber(),
  width_cm: positiveNumber(),
  height_cm: positiveNumber(),
})
type Values = z.infer<typeof schema>

const trackingList = (text: string) =>
  text
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter(Boolean)

/** Delivery request for the client's own cargo (scenario 3, section 5.2). */
export function SendCargo() {
  const { t } = useTranslation()
  const localized = useLocalized()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const warehouses = useQuery(publicWarehousesQuery()).data ?? []
  const foreign = warehouses.filter((w) => w.kind === 'foreign')
  const profile = useQuery(profileQuery()).data
  const cards = useQuery(cardsQuery()).data
  const [originPicked, setOriginPicked] = useState<number | null>(null)
  const originId = originPicked ?? foreign[0]?.id ?? null
  const origin = foreign.find((w) => w.id === originId)
  const [choice, setChoice] = useState<DeliveryChoice>({
    method: 'auto',
    receive: 'pickup',
    destinationId: null,
    address: '',
  })
  const { destinationId } = useDestination(choice.destinationId)
  const address = choice.address || profile?.address || ''

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      description: '',
      tracking: '',
      weight_kg: '',
      length_cm: '',
      width_cm: '',
      height_cm: '',
    },
  })
  const v = useWatch({ control: form.control }) as Values
  const dims = [v.weight_kg, v.length_cm, v.width_cm, v.height_cm].every(
    (x) => Number(x) > 0
  )
    ? {
        weight_kg: Number(v.weight_kg),
        length_cm: Number(v.length_cm),
        width_cm: Number(v.width_cm),
        height_cm: Number(v.height_cm),
      }
    : null
  const { quote, methods, minWeight } = useOrderQuote({
    originId,
    destinationId,
    method: choice.method,
    receive: choice.receive,
    dimensions: dims,
  })
  const method = methods.includes(choice.method)
    ? choice.method
    : (methods[0] ?? 'auto')
  const addressMissing = choice.receive === 'courier' && !address.trim()

  const create = useMutation({
    mutationFn: (values: Values) =>
      clientApi.createOrder({
        type: 'delivery',
        origin_warehouse_id: originId!,
        destination_warehouse_id: destinationId!,
        method,
        receive_method: choice.receive,
        delivery_address: choice.receive === 'courier' ? address : null,
        cargo: {
          description: values.description,
          tracking_numbers: trackingList(values.tracking),
          declared: dims!,
        },
      }),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: clientOrdersQuery().queryKey })
      toast.success(t('send.created', { number: order.number }))
      navigate({
        to: '/orders/$orderId',
        params: { orderId: String(order.id) },
      })
    },
    onError: (error) => applyServerErrors(error, form),
  })

  return (
    <div className='grid gap-6'>
      <div>
        <h1 className='text-2xl font-bold tracking-tight'>
          {t('site.nav.send')}
        </h1>
        <p className='text-muted-foreground'>{t('send.description')}</p>
      </div>
      {!profile?.full_name && profile && (
        <Alert>
          <AlertDescription>
            <Link to='/account' className='underline underline-offset-4'>
              {t('checkout.fillProfile')}
            </Link>
          </AlertDescription>
        </Alert>
      )}
      <Form {...form}>
        <form
          className='grid items-start gap-6 lg:grid-cols-[1fr_22rem]'
          onSubmit={form.handleSubmit(
            (values) => !addressMissing && create.mutate(values)
          )}
        >
          <div className='grid gap-6'>
            <Card>
              <CardHeader>
                <CardTitle>{t('send.from')}</CardTitle>
              </CardHeader>
              <CardContent className='grid gap-3'>
                <Tabs
                  value={originId ? String(originId) : ''}
                  onValueChange={(id) => setOriginPicked(Number(id))}
                >
                  <TabsList>
                    {foreign.map((w) => (
                      <TabsTrigger key={w.id} value={String(w.id)}>
                        {localized(w.country)}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
                {origin && (
                  <p className='text-sm text-muted-foreground'>
                    {t('send.warehouseAddress', {
                      address: `${origin.city}, ${origin.address}`,
                    })}
                  </p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t('orders.cargo')}</CardTitle>
              </CardHeader>
              <CardContent className='grid gap-4'>
                <TextField
                  control={form.control}
                  name='description'
                  label={t('send.cargoDescription')}
                  placeholder={t('send.cargoPlaceholder')}
                />
                <FormField
                  control={form.control}
                  name='tracking'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('orders.tracking')}</FormLabel>
                      <FormControl>
                        <Textarea rows={2} className='font-mono' {...field} />
                      </FormControl>
                      <FormDescription>
                        {t('send.trackingHint')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <TextField
                  control={form.control}
                  name='weight_kg'
                  label={t('dims.weight')}
                  description={t('send.approxHint')}
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
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t('checkout.delivery')}</CardTitle>
              </CardHeader>
              <CardContent>
                <DeliveryOptions
                  value={{ ...choice, method, address }}
                  onChange={setChoice}
                  methods={methods}
                  addressError={
                    addressMissing && form.formState.isSubmitted
                      ? t('validation.required')
                      : null
                  }
                />
              </CardContent>
            </Card>
          </div>

          <Card className='lg:sticky lg:top-24'>
            <CardHeader>
              <CardTitle>{t('checkout.summary')}</CardTitle>
            </CardHeader>
            <CardContent className='grid gap-4'>
              <QuoteSummary quote={quote} minWeight={minWeight} preliminary />
              {cards && !cards.some((c) => c.verified) && (
                <Alert>
                  <AlertDescription>
                    {t('send.cardLater')}{' '}
                    <Link
                      to='/account'
                      hash='cards'
                      className='underline underline-offset-4'
                    >
                      {t('account.addCard')}
                    </Link>
                  </AlertDescription>
                </Alert>
              )}
              <Button
                type='submit'
                disabled={
                  create.isPending ||
                  !profile?.full_name ||
                  !quote?.tariff ||
                  quote.below_minimum
                }
              >
                {t('send.submit')}
              </Button>
              <p className='text-xs text-muted-foreground'>
                {t('send.afterSubmit')}
              </p>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  )
}
