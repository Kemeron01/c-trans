import { setupWorker } from 'msw/browser'
import { authHandlers } from './handlers/auth'
import { catalogHandlers } from './handlers/catalog'
import { orderHandlers } from './handlers/orders'
import { referenceHandlers } from './handlers/reference'
import { setupHandlers } from './handlers/setup'
import { shipmentHandlers } from './handlers/shipments'
import { staffHandlers } from './handlers/staff'

export const worker = setupWorker(
  ...authHandlers,
  ...referenceHandlers,
  ...staffHandlers,
  ...setupHandlers,
  ...catalogHandlers,
  ...orderHandlers,
  ...shipmentHandlers
)
