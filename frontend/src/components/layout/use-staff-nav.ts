import { useTranslation } from 'react-i18next'
import { canAccess } from '@/lib/permissions'
import { useCurrentUser } from '@/hooks/use-current-user'
import { staffNav } from './data/staff-nav'
import { type NavGroup } from './types'

/** Sidebar groups translated and filtered by the current user's access. */
export function useStaffNav(): NavGroup[] {
  const { t } = useTranslation()
  const user = useCurrentUser()

  return staffNav
    .map(({ group, items }) => ({
      title: t(`nav.groups.${group}`),
      items: items
        .filter((item) => canAccess(user, item.section))
        .map(({ section, url, icon }) => ({
          title: t(`nav.sections.${section}`),
          url,
          icon,
        })),
    }))
    .filter((group) => group.items.length > 0)
}
