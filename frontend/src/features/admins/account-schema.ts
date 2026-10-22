import {
  optionalEmail,
  optionalString,
  passwordSchema,
  requiredString,
  usernameSchema,
} from '@/lib/validation'

/** Profile fields shared by admin accounts and worker requests. */
export const profileShape = {
  full_name: requiredString(),
  phone: optionalString(),
  email: optionalEmail(),
}

/** Login fields: set once on creation (the username cannot be changed). */
export const credentialsShape = {
  username: usernameSchema(),
  password: passwordSchema(),
}
