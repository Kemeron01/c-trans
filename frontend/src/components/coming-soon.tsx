import { Telescope } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function ComingSoon() {
  const { t } = useTranslation()
  return (
    <div className='flex min-h-[50svh] flex-col items-center justify-center gap-2 text-center'>
      <Telescope size={56} className='text-muted-foreground' />
      <h2 className='text-2xl leading-tight font-bold'>
        {t('common.comingSoonTitle')}
      </h2>
      <p className='text-muted-foreground'>{t('common.comingSoonDesc')}</p>
    </div>
  )
}
