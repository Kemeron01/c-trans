import { z } from 'zod'

// Messages are i18n keys (see FormMessage in components/ui/form.tsx).

export const requiredString = () =>
  z.string().trim().min(1, 'validation.required')

export const optionalString = () => z.string().trim()

export const localizedTextSchema = () =>
  z.object({ ru: requiredString(), uz: requiredString(), en: requiredString() })

export const usernameSchema = () =>
  z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9._-]{3,32}$/, 'validation.username')

export const passwordSchema = () => z.string().min(8, 'validation.password')

export const optionalEmail = () =>
  z.union([z.literal(''), z.email('validation.email')])
