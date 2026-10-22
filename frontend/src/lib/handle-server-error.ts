import { AxiosError } from 'axios'
import { toast } from 'sonner'
import { type ApiErrorBody } from '@/api/types'
import i18n from '@/lib/i18n'

export function handleServerError(error: unknown) {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log(error)
  }

  let errMsg: string = i18n.t('errors.generic')

  if (
    error &&
    typeof error === 'object' &&
    'status' in error &&
    Number(error.status) === 204
  ) {
    errMsg = i18n.t('errors.noContent')
  }

  if (error instanceof AxiosError) {
    // DRF puts a human-readable message into `detail`
    const detail = (error.response?.data as ApiErrorBody | undefined)?.detail
    if (typeof detail === 'string' && detail.length > 0) {
      errMsg = detail
    }
  }

  toast.error(errMsg)
}
