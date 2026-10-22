import { useTranslation } from 'react-i18next'
import { ErrorPage } from './error-page'

export function MaintenanceError() {
  const { t } = useTranslation()
  return (
    <ErrorPage
      code={503}
      title={t('errors.maintenanceTitle')}
      description={t('errors.maintenanceDesc')}
      withActions={false}
    />
  )
}
