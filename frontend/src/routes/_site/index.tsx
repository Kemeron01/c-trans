import { createFileRoute } from '@tanstack/react-router'
import { Landing } from '@/features/site/landing'

export const Route = createFileRoute('/_site/')({
  component: Landing,
})
