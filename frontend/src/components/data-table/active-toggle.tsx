import { useTranslation } from 'react-i18next'
import { Toggle } from '@/components/ui/toggle'

/** "Active only" quick filter; keep its state in the URL with `useSearchFlag('active')`. */
export function ActiveToggle({
  pressed,
  onPressedChange,
}: {
  pressed: boolean
  onPressedChange: (on: boolean) => void
}) {
  const { t } = useTranslation()
  return (
    <Toggle
      variant='outline'
      size='sm'
      pressed={pressed}
      onPressedChange={onPressedChange}
      aria-label={t('dataTable.activeOnly')}
    >
      {t('dataTable.activeOnly')}
    </Toggle>
  )
}
