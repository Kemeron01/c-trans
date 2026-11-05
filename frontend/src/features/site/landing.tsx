import { lazy, Suspense, useState } from 'react'
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
import { InteractiveGridPattern } from '@/components/ui/interactive-grid-pattern'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DeliveryCalculator } from '@/components/delivery-calculator'
import { AnimatedText, Reveal } from '@/components/reveal'
import { LandingFaq } from './landing-faq'
import { LandingStats } from './landing-stats'

// The globe pulls in cobe + WebGL code: load it only for the landing page
const DeliveryGlobe = lazy(() =>
  import('./delivery-globe').then((m) => ({ default: m.DeliveryGlobe }))
)

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
      <section className='relative isolate grid items-center gap-6 overflow-hidden py-8 sm:py-12 lg:grid-cols-2 lg:gap-10'>
        {/* Thin interactive grid, faded out toward the edges so the text stays readable */}
        <InteractiveGridPattern
          width={44}
          height={44}
          squares={[40, 24]}
          aria-hidden
          className='-z-10 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_72%)] stroke-foreground/10 dark:stroke-white/10'
          squaresClassName='stroke-foreground/10 dark:stroke-white/10'
        />
        <div className='grid content-center justify-items-start gap-5 text-start'>
          <div className='flex flex-wrap gap-2'>
            {foreign.map((w) => (
              <Badge key={w.id} variant='secondary'>
                {localized(w.country)} → {t('site.uzbekistan')}
              </Badge>
            ))}
          </div>
          <AnimatedText
            as='h1'
            className='max-w-xl text-3xl font-bold tracking-tight sm:text-5xl'
          >
            {t('landing.title')}
          </AnimatedText>
          <AnimatedText
            as='p'
            className='max-w-xl text-lg text-muted-foreground'
            delay={0.15}
          >
            {t('landing.lead')}
          </AnimatedText>
          <div className='flex flex-wrap gap-3'>
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
        </div>
        <div className='mx-auto w-full max-w-64 sm:max-w-sm lg:max-w-none'>
          <Suspense fallback={<div className='aspect-square w-full' />}>
            <DeliveryGlobe />
          </Suspense>
        </div>
      </section>

      <LandingStats />

      <section className='grid gap-4' id='calculator'>
        <div className='flex flex-wrap items-end justify-between gap-3'>
          <div className='grid gap-1'>
            <AnimatedText className='text-2xl font-bold tracking-tight'>
              {t('nav.sections.calculator')}
            </AnimatedText>
            <AnimatedText as='p' className='text-muted-foreground' delay={0.1}>
              {t('landing.calculatorHint')}
            </AnimatedText>
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
          <Reveal>
            <DeliveryCalculator
              key={warehouseId}
              settings={pricing.settings}
              tariffs={pricing.tariffs}
              methods={methods}
            />
          </Reveal>
        )}
      </section>

      <section className='grid gap-4'>
        <AnimatedText className='text-2xl font-bold tracking-tight'>
          {t('landing.howTitle')}
        </AnimatedText>
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          {steps.map(({ icon: Icon, key }, i) => (
            <Reveal key={key} delay={i * 0.08} className='h-full'>
              <Card className='h-full'>
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
            </Reveal>
          ))}
        </div>
      </section>

      <LandingFaq />
    </div>
  )
}
