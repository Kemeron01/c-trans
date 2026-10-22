import { useTranslation } from 'react-i18next'
import { ErrorPage } from './error-page'

type GeneralErrorProps = {
  minimal?: boolean
  className?: string
}

export function GeneralError({
  className,
  minimal = false,
}: GeneralErrorProps) {
  const { t } = useTranslation()
  return (
    <ErrorPage
      code={minimal ? undefined : 500}
      title={t('errors.generalTitle')}
      description={t('errors.generalDesc')}
      withActions={!minimal}
      className={className}
    />
  )
}
