import { createFileRoute } from '@tanstack/react-router'
import { ClientCatalog } from '@/features/client/catalog'

export const Route = createFileRoute('/_site/catalog')({
  // ?warehouse=ID opens the catalog of that warehouse (header menu)
  validateSearch: (search: Record<string, unknown>): { warehouse?: number } => {
    const warehouse = Number(search.warehouse)
    return warehouse ? { warehouse } : {}
  },
  component: ClientCatalog,
})
