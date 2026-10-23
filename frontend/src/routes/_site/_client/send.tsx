import { createFileRoute } from '@tanstack/react-router'
import { SendCargo } from '@/features/client/send'

export const Route = createFileRoute('/_site/_client/send')({
  component: SendCargo,
})
