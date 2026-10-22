import { useTranslation } from 'react-i18next'
import { type Section } from '@/lib/permissions'
import { ComingSoon } from '@/components/coming-soon'
import { AppHeader } from '@/components/layout/app-header'
import { Main } from '@/components/layout/main'

/** Temporary page for admin sections that are not built yet. */
export function SectionPlaceholder({ section }: { section: Section }) {
  const { t } = useTranslation()
  return (
    <>
      <AppHeader />
      <Main className='flex flex-1 flex-col gap-4'>
        <h2 className='text-2xl font-bold tracking-tight'>
          {t(`nav.sections.${section}`)}
        </h2>
        <ComingSoon />
      </Main>
    </>
  )
}
