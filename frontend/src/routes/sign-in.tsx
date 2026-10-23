import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { ClientSignIn } from '@/features/client/sign-in'

const searchSchema = z.object({
  // Only site pages (not the admin panel, not other origins)
  redirect: z
    .string()
    .regex(/^\/(?!\/|admin)/)
    .optional()
    .catch(undefined),
})

export const Route = createFileRoute('/sign-in')({
  validateSearch: searchSchema,
  component: ClientSignIn,
})
