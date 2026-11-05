import { useTranslation } from 'react-i18next'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { AnimatedText, Reveal } from '@/components/reveal'
import { LANDING_FAQ, LANDING_TRANSIT_DAYS } from './landing-mock-data'

const ITEMS = [
  'cost',
  'charge',
  'track',
  'courier',
  'send',
  'time',
  'cancel',
] as const

/** Figures used inside the answers (see landing-mock-data.ts). */
const VALUES = {
  aviaDivisor: LANDING_FAQ.volumeDivisor.avia,
  autoDivisor: LANDING_FAQ.volumeDivisor.auto,
  minWeight: LANDING_FAQ.minWeightKg,
  chargeMinutes: LANDING_FAQ.autoChargeMinutes,
  aviaMin: LANDING_TRANSIT_DAYS.avia.min,
  aviaMax: LANDING_TRANSIT_DAYS.avia.max,
  autoMin: LANDING_TRANSIT_DAYS.auto.min,
  autoMax: LANDING_TRANSIT_DAYS.auto.max,
}

export function LandingFaq() {
  const { t } = useTranslation()
  return (
    <section className='grid gap-4' id='faq'>
      <div className='grid gap-1'>
        <AnimatedText className='text-2xl font-bold tracking-tight'>
          {t('landing.faqTitle')}
        </AnimatedText>
        <AnimatedText as='p' className='text-muted-foreground' delay={0.1}>
          {t('landing.faqLead')}
        </AnimatedText>
      </div>
      <Reveal>
        <Accordion type='single' collapsible className='rounded-lg border px-4'>
          {ITEMS.map((key) => (
            <AccordionItem key={key} value={key}>
              <AccordionTrigger>{t(`landing.faq.${key}.q`)}</AccordionTrigger>
              <AccordionContent className='text-muted-foreground'>
                {t(`landing.faq.${key}.a`, VALUES)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Reveal>
    </section>
  )
}
