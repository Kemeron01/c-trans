import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { ImageOff, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  cardsQuery,
  clientApi,
  clientOrdersQuery,
  profileQuery,
  publicProductsQuery,
} from '@/api/account'
import { meQueryOptions } from '@/api/auth'
import { useAuthStore } from '@/stores/auth-store'
import { useCartStore } from '@/stores/cart-store'
import { formatUsd } from '@/lib/format'
import { isStaff } from '@/lib/permissions'
import { itemsDimensions } from '@/lib/pricing'
import { useLocalized } from '@/hooks/use-localized'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/empty-state'
import {
  DeliveryOptions,
  type DeliveryChoice,
  QuoteSummary,
} from './delivery-options'
import { useDestination, useOrderQuote } from './use-order-quote'

/** Cart → delivery options → total → order (scenario 2). */
export function Cart() {
  const { t } = useTranslation()
  const localized = useLocalized()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { warehouseId, lines, setQuantity, clear } = useCartStore()
  const products =
    useQuery({
      ...publicProductsQuery(warehouseId ?? 0),
      enabled: !!warehouseId,
    }).data ?? []
  const token = useAuthStore((s) => s.accessToken)
  const me = useQuery({
    ...meQueryOptions(),
    enabled: !!token,
    meta: { publicPage: true },
  }).data
  const isClient = !!me && !isStaff(me)
  const profile = useQuery({ ...profileQuery(), enabled: isClient }).data
  const cards = useQuery({ ...cardsQuery(), enabled: isClient }).data
  const hasCard = !!cards?.some((c) => c.verified)

  const [choice, setChoice] = useState<DeliveryChoice>({
    method: 'auto',
    receive: 'pickup',
    destinationId: null,
    address: '',
  })
  const { destinationId } = useDestination(choice.destinationId)
  const address = choice.address || profile?.address || ''

  const rows = lines.flatMap((l) => {
    const product = products.find((p) => p.id === l.product_id)
    return product ? [{ product, quantity: l.quantity }] : []
  })
  const goods = rows.reduce((s, r) => s + r.product.price * r.quantity, 0)
  const { quote, methods, minWeight } = useOrderQuote({
    originId: warehouseId,
    destinationId,
    method: choice.method,
    receive: choice.receive,
    dimensions: rows.length ? itemsDimensions(rows) : null,
    goodsUsd: goods,
  })
  const method = methods.includes(choice.method)
    ? choice.method
    : (methods[0] ?? 'auto')

  const order = useMutation({
    mutationFn: () =>
      clientApi.createOrder({
        type: 'catalog',
        origin_warehouse_id: warehouseId!,
        destination_warehouse_id: destinationId!,
        method,
        receive_method: choice.receive,
        delivery_address: choice.receive === 'courier' ? address : null,
        items: lines,
      }),
    onSuccess: (created) => {
      clear()
      queryClient.invalidateQueries({ queryKey: clientOrdersQuery().queryKey })
      toast.success(t('checkout.placed', { number: created.number }))
      navigate({
        to: '/orders/$orderId',
        params: { orderId: String(created.id) },
      })
    },
  })

  if (!lines.length) {
    return (
      <EmptyState icon={ShoppingBag} title={t('checkout.emptyCart')}>
        <Button asChild className='mt-2'>
          <Link to='/catalog'>{t('site.nav.catalog')}</Link>
        </Button>
      </EmptyState>
    )
  }

  const blocked = !quote?.tariff || quote.below_minimum
  const addressMissing = choice.receive === 'courier' && !address.trim()

  return (
    <div className='grid gap-6'>
      <h1 className='text-2xl font-bold tracking-tight'>
        {t('site.nav.cart')}
      </h1>
      <div className='grid items-start gap-6 lg:grid-cols-[1fr_22rem]'>
        <div className='grid gap-6'>
          <Card>
            <CardContent className='grid gap-3'>
              {rows.map(({ product: p, quantity }) => (
                <div key={p.id} className='flex items-center gap-3'>
                  {p.photo_url ? (
                    <img
                      src={p.photo_url}
                      alt=''
                      className='size-14 rounded-md object-cover'
                    />
                  ) : (
                    <div className='flex size-14 items-center justify-center rounded-md bg-muted'>
                      <ImageOff className='size-5 text-muted-foreground' />
                    </div>
                  )}
                  <div className='grid flex-1'>
                    <span className='font-medium'>{localized(p.name)}</span>
                    <span className='text-sm text-muted-foreground'>
                      {formatUsd(p.price)}
                    </span>
                  </div>
                  <div className='flex items-center rounded-md border'>
                    <Button
                      variant='ghost'
                      size='icon'
                      aria-label='−'
                      onClick={() => setQuantity(p.id, quantity - 1)}
                    >
                      <Minus />
                    </Button>
                    <span className='w-8 text-center tabular-nums'>
                      {quantity}
                    </span>
                    <Button
                      variant='ghost'
                      size='icon'
                      aria-label='+'
                      disabled={quantity >= p.stock.quantity - p.stock.reserved}
                      onClick={() => setQuantity(p.id, quantity + 1)}
                    >
                      <Plus />
                    </Button>
                  </div>
                  <Button
                    variant='ghost'
                    size='icon'
                    aria-label={t('common.delete')}
                    onClick={() => setQuantity(p.id, 0)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              ))}
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
                addressError={addressMissing ? t('validation.required') : null}
              />
            </CardContent>
          </Card>
        </div>

        <Card className='lg:sticky lg:top-24'>
          <CardHeader>
            <CardTitle>{t('checkout.summary')}</CardTitle>
          </CardHeader>
          <CardContent className='grid gap-4'>
            <QuoteSummary quote={quote} minWeight={minWeight} />
            {!isClient ? (
              <Button
                onClick={() =>
                  navigate({ to: '/sign-in', search: { redirect: '/cart' } })
                }
              >
                {t('checkout.signInToOrder')}
              </Button>
            ) : !profile?.full_name ? (
              <Alert>
                <AlertDescription>
                  <Link to='/account' className='underline underline-offset-4'>
                    {t('checkout.fillProfile')}
                  </Link>
                </AlertDescription>
              </Alert>
            ) : !hasCard ? (
              <Alert>
                <AlertDescription>
                  {t('checkout.needCard')}{' '}
                  <Link
                    to='/account'
                    hash='cards'
                    className='underline underline-offset-4'
                  >
                    {t('account.addCard')}
                  </Link>
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <Button
                  disabled={blocked || addressMissing || order.isPending}
                  onClick={() => order.mutate()}
                >
                  {t('checkout.placeOrder')}
                </Button>
                <p className='text-xs text-muted-foreground'>
                  {t('checkout.autoCharge')}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
