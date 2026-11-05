import { useRef } from 'react'
import { useInView, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { formatNumber } from '@/lib/format'
import { useCountUp } from '@/hooks/use-count-up'
import { AnimatedCircularProgressBar } from '@/components/ui/animated-circular-progress-bar'
import { Card, CardContent } from '@/components/ui/card'
import { AnimatedText, Reveal } from '@/components/reveal'
import {
  LANDING_COUNTERS,
  LANDING_GAUGES,
  LANDING_TRANSIT_TYPICAL,
} from './landing-mock-data'

const GAUGES = ['onTime', 'happyClients', 'undamaged'] as const
const COUNTERS = ['delivered', 'clients', 'kgPerMonth'] as const

/** Gauge that fills from 0 once, when it is scrolled into view. */
function Gauge({ value, label }: { value: number; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -40px 0px' })
  const reduced = useReducedMotion()
  return (
    <div ref={ref} className='grid justify-items-center gap-2 text-center'>
      <AnimatedCircularProgressBar
        value={inView || reduced ? value : 0}
        instant={!!reduced}
        gaugePrimaryColor='var(--primary)'
        gaugeSecondaryColor='var(--border)'
        className='size-24 text-lg sm:size-32 sm:text-2xl'
      />
      <div className='text-xs text-muted-foreground sm:text-sm'>{label}</div>
    </div>
  )
}

function Counter({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -40px 0px' })
  const shown = useCountUp(value, inView)
  return <span ref={ref}>{formatNumber(shown)}</span>
}

/** Two counters in one card: "7 / 18 days". */
function TransitCounter() {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -40px 0px' })
  const avia = useCountUp(LANDING_TRANSIT_TYPICAL.avia, inView)
  const auto = useCountUp(LANDING_TRANSIT_TYPICAL.auto, inView)
  return (
    <span ref={ref}>
      {avia} / {auto}
    </span>
  )
}

export function LandingStats() {
  const { t } = useTranslation()
  return (
    <section className='grid gap-6'>
      <div className='grid gap-1'>
        <AnimatedText className='text-2xl font-bold tracking-tight'>
          {t('landing.statsTitle')}
        </AnimatedText>
        <AnimatedText as='p' className='text-muted-foreground' delay={0.1}>
          {t('landing.statsLead')}
        </AnimatedText>
      </div>
      <div className='grid gap-6 lg:grid-cols-[3fr_2fr] lg:items-center'>
        <Reveal className='grid grid-cols-3 gap-2 sm:gap-4'>
          {GAUGES.map((key) => (
            <Gauge
              key={key}
              value={LANDING_GAUGES[key]}
              label={t(`landing.gauges.${key}`)}
            />
          ))}
        </Reveal>
        <div className='grid grid-cols-2 gap-3'>
          {[...COUNTERS, 'transit' as const].map((key, i) => (
            <Reveal key={key} delay={i * 0.08}>
              <Card className='h-full'>
                <CardContent className='grid gap-1'>
                  <div className='text-2xl font-bold tracking-tight tabular-nums sm:text-3xl'>
                    {key === 'transit' ? (
                      <TransitCounter />
                    ) : (
                      <Counter value={LANDING_COUNTERS[key]} />
                    )}
                  </div>
                  <div className='text-xs text-muted-foreground sm:text-sm'>
                    {t(`landing.counters.${key}`)}
                  </div>
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
