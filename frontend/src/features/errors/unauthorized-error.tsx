import { useTranslation } from 'react-i18next'
import { ErrorPage } from './error-page'

export function UnauthorisedError() {
  const { t } = useTranslation()
  return (
    <ErrorPage
      code={401}
      title={t('errors.unauthorizedTitle')}
      description={t('errors.unauthorizedDesc')}
    />
  )
}
