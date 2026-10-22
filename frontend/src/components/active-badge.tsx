import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'

export function ActiveBadge({ active }: { active: boolean }) {
  const { t } = useTranslation()
  return (
    <Badge variant={active ? 'secondary' : 'outline'}>
      {active ? t('common.active') : t('common.inactive')}
    </Badge>
  )
}
