import { setupWorker } from 'msw/browser'
import { authHandlers } from './handlers/auth'
import { referenceHandlers } from './handlers/reference'
import { staffHandlers } from './handlers/staff'

export const worker = setupWorker(
  ...authHandlers,
  ...referenceHandlers,
  ...staffHandlers
)
