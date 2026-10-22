import { useTranslation } from 'react-i18next'
import { ErrorPage } from './error-page'

export function NotFoundError() {
  const { t } = useTranslation()
  return (
    <ErrorPage
      code={404}
      title={t('errors.notFoundTitle')}
      description={t('errors.notFoundDesc')}
    />
  )
}
