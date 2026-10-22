import { AxiosError } from 'axios'
import {
  type FieldValues,
  type Path,
  type UseFormReturn,
} from 'react-hook-form'
import { type ApiErrorBody } from '@/api/types'
import { handleServerError } from './handle-server-error'

/**
 * Shows DRF validation errors (`400 { field: ["message"] }`) under the
 * matching form fields; anything else goes to the generic error toast.
 */
export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  form: UseFormReturn<T>
) {
  const data = (
    error instanceof AxiosError && error.response?.status === 400
      ? error.response.data
      : null
  ) as ApiErrorBody | null

  const fieldNames = Object.keys(form.getValues())
  let applied = false
  for (const [field, messages] of Object.entries(data ?? {})) {
    const message = Array.isArray(messages) ? messages[0] : messages
    if (fieldNames.includes(field) && typeof message === 'string') {
      form.setError(field as Path<T>, { message })
      applied = true
    }
  }
  if (!applied) handleServerError(error)
}
