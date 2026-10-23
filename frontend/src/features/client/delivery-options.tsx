import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { type DeliveryMethod, type ReceiveMethod } from '@/api/types'
import { formatNumber, formatUsd } from '@/lib/format'
import { type OrderQuote } from '@/lib/pricing'
import { useUzs } from '@/hooks/use-uzs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDestination } from './use-order-quote'

export type DeliveryChoice = {
  method: DeliveryMethod
  receive: ReceiveMethod
  destinationId: number | null
  address: string
}

/** Delivery method, pickup / courier, Uzbek warehouse and address (sections 2.1, 7). */
export function DeliveryOptions({
  value,
  onChange,
  methods,
  addressError,
}: {
  value: DeliveryChoice
  onChange: (value: DeliveryChoice) => void
  methods: DeliveryMethod[]
  addressError?: string | null
}) {
  const { t } = useTranslation()
  const { local, destinationId } = useDestination(value.destinationId)
  const set = (patch: Partial<DeliveryChoice>) =>
    onChange({ ...value, ...patch })

  return (
    <div className='grid gap-4'>
      <div className='grid gap-2'>
        <Label>{t('orders.method')}</Label>
        <Tabs
          value={value.method}
          onValueChange={(m) => set({ method: m as DeliveryMethod })}
        >
          <TabsList>
            {methods.map((m) => (
              <TabsTrigger key={m} value={m}>
                {t(`method.${m}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      <div className='grid gap-2'>
        <Label>{t('checkout.receive')}</Label>
        <RadioGroup
          value={value.receive}
          onValueChange={(r) => set({ receive: r as ReceiveMethod })}
          className='grid gap-2 sm:grid-cols-2'
        >
          {(['pickup', 'courier'] as const).map((r) => (
            <Label
              key={r}
              className='flex cursor-pointer items-start gap-3 rounded-md border p-3 font-normal has-[[data-state=checked]]:border-primary'
            >
              <RadioGroupItem value={r} className='mt-0.5' />
              <span className='grid gap-0.5'>
                <span className='font-medium'>{t(`receiveMethod.${r}`)}</span>
                <span className='text-xs text-muted-foreground'>
                  {t(`checkout.${r}Hint`)}
                </span>
              </span>
            </Label>
          ))}
        </RadioGroup>
      </div>
      {local.length > 1 && (
        <div className='grid gap-2'>
          <Label>{t('shipments.destination')}</Label>
          <Select
            value={destinationId ? String(destinationId) : ''}
            onValueChange={(v) => set({ destinationId: Number(v) })}
          >
            <SelectTrigger className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {local.map((w) => (
                <SelectItem key={w.id} value={String(w.id)}>
                  {w.name} · {w.address}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {value.receive === 'pickup' &&
        local.find((w) => w.id === destinationId) && (
          <p className='text-sm text-muted-foreground'>
            {t('checkout.pickupFrom', {
              address: `${local.find((w) => w.id === destinationId)!.city}, ${local.find((w) => w.id === destinationId)!.address}`,
            })}
          </p>
        )}
      {value.receive === 'courier' && (
        <div className='grid gap-2'>
          <Label htmlFor='delivery-address'>{t('account.address')}</Label>
          <Input
            id='delivery-address'
            value={value.address}
            onChange={(e) => set({ address: e.target.value })}
            aria-invalid={!!addressError}
            autoComplete='street-address'
          />
          {addressError && (
            <p className='text-sm text-destructive'>{addressError}</p>
          )}
        </div>
      )}
    </div>
  )
}

/** Price breakdown: goods + delivery + courier, USD and UZS (4.2, 4.3). */
export function QuoteSummary({
  quote,
  minWeight,
  preliminary,
}: {
  quote: OrderQuote | null
  minWeight: number
  preliminary?: boolean
}) {
  const { t } = useTranslation()
  const { uzs } = useUzs()
  if (!quote)
    return (
      <p className='text-sm text-muted-foreground'>{t('calculator.fill')}</p>
    )
  return (
    <div className='grid gap-3'>
      <dl className='grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-sm'>
        {quote.goods_usd > 0 && (
          <>
            <dt className='text-muted-foreground'>{t('orders.goods')}</dt>
            <dd>{formatUsd(quote.goods_usd)}</dd>
          </>
        )}
        <dt className='text-muted-foreground'>
          {t('orders.delivery')} · {formatNumber(quote.chargeable_weight)}{' '}
          {t('dims.kg')}
        </dt>
        <dd>{formatUsd(quote.delivery_usd)}</dd>
        {quote.courier_usd > 0 && (
          <>
            <dt className='text-muted-foreground'>{t('orders.courier')}</dt>
            <dd>{formatUsd(quote.courier_usd)}</dd>
          </>
        )}
      </dl>
      <div className='rounded-lg bg-muted p-4'>
        <div className='text-sm text-muted-foreground'>
          {preliminary ? t('checkout.preliminaryTotal') : t('orders.total')}
        </div>
        <div className='text-2xl font-bold'>{formatUsd(quote.total_usd)}</div>
        <div className='text-sm text-muted-foreground'>
          {uzs(quote.total_usd)}
        </div>
      </div>
      {preliminary && (
        <p className='text-xs text-muted-foreground'>
          {t('checkout.preliminaryHint')}
        </p>
      )}
      {quote.below_minimum && (
        <Alert variant='destructive'>
          <AlertTriangle />
          <AlertDescription>
            {t('calculator.belowMinimum', {
              min: `${formatNumber(minWeight)} ${t('dims.kg')}`,
            })}
          </AlertDescription>
        </Alert>
      )}
      {!quote.tariff && (
        <Alert variant='destructive'>
          <AlertTriangle />
          <AlertDescription>{t('calculator.noTariff')}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
