import { createFileRoute, redirect } from '@tanstack/react-router'
import { canAccess } from '@/lib/permissions'
import { firstAllowedUrl } from '@/lib/route-guards'
import { SectionPlaceholder } from '@/features/section-placeholder'

export const Route = createFileRoute('/admin/_staff/')({
  beforeLoad: ({ context }) => {
    // Workers have no dashboard: open their first available section
    if (!canAccess(context.user, 'dashboard')) {
      throw redirect({ to: firstAllowedUrl(context.user) ?? '/403' })
    }
  },
  component: () => <SectionPlaceholder section='dashboard' />,
})
