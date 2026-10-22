import { Link } from '@tanstack/react-router'
import { LogIn } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Logo } from '@/assets/logo'
import { Button } from '@/components/ui/button'
import { LanguageSwitch } from '@/components/language-switch'
import { ThemeSwitch } from '@/components/theme-switch'

// Placeholder for the client platform (stage 5).
export function Landing() {
  const { t } = useTranslation()
  return (
    <div className='flex min-h-svh flex-col'>
      <header className='flex items-center gap-2 p-4'>
        <Logo />
        <span className='me-auto text-lg font-semibold'>
          {t('common.appName')}
        </span>
        <LanguageSwitch />
        <ThemeSwitch />
      </header>
      <main className='flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center'>
        <h1 className='max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl'>
          {t('landing.title')}
        </h1>
        <p className='text-muted-foreground'>{t('landing.subtitle')}</p>
        <Button asChild variant='outline' className='mt-4'>
          <Link to='/admin'>
            <LogIn />
            {t('landing.staffLogin')}
          </Link>
        </Button>
      </main>
    </div>
  )
}
