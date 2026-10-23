import { createFileRoute } from '@tanstack/react-router'
import { ClientCatalog } from '@/features/client/catalog'

export const Route = createFileRoute('/_site/catalog')({
  component: ClientCatalog,
})
