import { createFileRoute } from '@tanstack/react-router'
import { Cart } from '@/features/client/cart'

export const Route = createFileRoute('/_site/cart')({
  component: Cart,
})
