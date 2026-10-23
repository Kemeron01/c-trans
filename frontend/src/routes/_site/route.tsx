import { createFileRoute } from '@tanstack/react-router'
import { SiteLayout } from '@/features/site/site-layout'

// Client platform pages (public and signed-in) share the site header.
export const Route = createFileRoute('/_site')({
  component: SiteLayout,
})
