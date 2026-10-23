import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Account } from '@/features/client/account'

export const Route = createFileRoute('/_site/_client/account')({
  validateSearch: z.object({
    welcome: z.boolean().optional().catch(undefined),
  }),
  component: Account,
})
