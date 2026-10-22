import { useTranslation } from 'react-i18next'
import { ErrorPage } from './error-page'

export function ForbiddenError() {
  const { t } = useTranslation()
  return (
    <ErrorPage
      code={403}
      title={t('errors.forbiddenTitle')}
      description={t('errors.forbiddenDesc')}
    />
  )
}
