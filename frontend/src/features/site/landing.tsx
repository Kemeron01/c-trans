import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { MapPinned, PackageCheck, Scale, Send, ShoppingBag } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { pricingQuery, publicWarehousesQuery } from '@/api/account'
import { type DeliveryMethod } from '@/api/types'
import { useLocalized } from '@/hooks/use-localized'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DeliveryCalculator } from '@/components/delivery-calculator'

export function Landing() {
  const { t } = useTranslation()
  const localized = useLocalized()
  const warehouses = useQuery(publicWarehousesQuery()).data ?? []
  const foreign = warehouses.filter((w) => w.kind === 'foreign')
  const [picked, setPicked] = useState<number | null>(null)
  const warehouseId = picked ?? foreign[0]?.id ?? null
  const pricing = useQuery({
    ...pricingQuery(warehouseId ?? 0),
    enabled: !!warehouseId,
  }).data
  const methods = (['auto', 'avia'] as DeliveryMethod[]).filter((m) =>
    pricing?.tariffs.some((tr) => tr.method === m)
  )

  const steps = [
    { icon: Send, key: 'step1' },
    { icon: Scale, key: 'step2' },
    { icon: MapPinned, key: 'step3' },
    { icon: PackageCheck, key: 'step4' },
  ] as const

  return (
    <div className='grid gap-16'>
      <section className='grid gap-6 py-6 text-center sm:py-12'>
        <div className='flex flex-wrap justify-center gap-2'>
          {foreign.map((w) => (
            <Badge key={w.id} variant='secondary'>
              {localized(w.country)} → {t('site.uzbekistan')}
            </Badge>
          ))}
        </div>
        <h1 className='mx-auto max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl'>
          {t('landing.title')}
        </h1>
        <p className='mx-auto max-w-2xl text-lg text-muted-foreground'>
          {t('landing.lead')}
        </p>
        <div className='flex flex-wrap justify-center gap-3'>
          <Button asChild size='lg'>
            <Link to='/send'>
              <Send /> {t('site.nav.send')}
            </Link>
          </Button>
          <Button asChild size='lg' variant='outline'>
            <Link to='/catalog'>
              <ShoppingBag /> {t('site.nav.catalog')}
            </Link>
          </Button>
        </div>
      </section>

      <section className='grid gap-4' id='calculator'>
        <div className='flex flex-wrap items-end justify-between gap-3'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>
              {t('nav.sections.calculator')}
            </h2>
            <p className='text-muted-foreground'>
              {t('landing.calculatorHint')}
            </p>
          </div>
          <Tabs
            value={warehouseId ? String(warehouseId) : ''}
            onValueChange={(v) => setPicked(Number(v))}
          >
            <TabsList>
              {foreign.map((w) => (
                <TabsTrigger key={w.id} value={String(w.id)}>
                  {localized(w.country)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        {pricing && methods.length > 0 && (
          <DeliveryCalculator
            key={warehouseId}
            settings={pricing.settings}
            tariffs={pricing.tariffs}
            methods={methods}
          />
        )}
      </section>

      <section className='grid gap-4'>
        <h2 className='text-2xl font-bold tracking-tight'>
          {t('landing.howTitle')}
        </h2>
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          {steps.map(({ icon: Icon, key }, i) => (
            <Card key={key}>
              <CardContent className='grid gap-2'>
                <Icon className='size-6 text-primary' />
                <div className='font-medium'>
                  {i + 1}. {t(`landing.${key}.title`)}
                </div>
                <p className='text-sm text-muted-foreground'>
                  {t(`landing.${key}.text`)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
