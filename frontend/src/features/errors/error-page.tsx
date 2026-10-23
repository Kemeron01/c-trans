import { useNavigate, useRouter } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type ErrorPageProps = {
  code?: number
  title: string
  description: string
  /** Show "Back" / "Home" buttons. */
  withActions?: boolean
  className?: string
  /** Extra content under the buttons (e.g. a reload button). */
  children?: React.ReactNode
}

export function ErrorPage({
  code,
  title,
  description,
  withActions = true,
  className,
  children,
}: ErrorPageProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { history } = useRouter()
  return (
    <div className={cn('h-svh w-full', className)}>
      <div className='m-auto flex h-full w-full flex-col items-center justify-center gap-2 px-4'>
        {code && (
          <h1 className='text-[7rem] leading-tight font-bold'>{code}</h1>
        )}
        <span className='font-medium'>{title}</span>
        <p className='max-w-sm text-center text-muted-foreground'>
          {description}
        </p>
        {withActions && (
          <div className='mt-6 flex gap-4'>
            <Button variant='outline' onClick={() => history.go(-1)}>
              {t('common.goBack')}
            </Button>
            <Button onClick={() => navigate({ to: '/' })}>
              {t('common.backHome')}
            </Button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
