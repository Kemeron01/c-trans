import { useEffect } from 'react'
import { type ErrorComponentProps } from '@tanstack/react-router'
import { RotateCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { isChunkLoadError, reloadOnce } from '@/lib/chunk-reload'
import { Button } from '@/components/ui/button'
import { ErrorPage } from './error-page'

/**
 * Router error boundary: a page failed to load or render. Not a server
 * error (that one is /500), so no "500" here.
 */
export function AppError({ error }: ErrorComponentProps) {
  const { t } = useTranslation()
  const outdated = isChunkLoadError(error)

  useEffect(() => {
    if (outdated) reloadOnce()
  }, [outdated])

  return (
    <ErrorPage
      title={outdated ? t('errors.outdatedTitle') : t('errors.generalTitle')}
      description={
        outdated ? t('errors.outdatedDesc') : t('errors.generalDesc')
      }
    >
      <Button onClick={() => window.location.reload()}>
        <RotateCw /> {t('errors.reload')}
      </Button>
      {import.meta.env.DEV && error instanceof Error && (
        <pre className='mt-4 max-w-2xl overflow-auto rounded-md bg-muted p-3 text-start text-xs whitespace-pre-wrap'>
          {error.message}
        </pre>
      )}
    </ErrorPage>
  )
}
