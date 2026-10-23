import { setupWorker } from 'msw/browser'
import { analyticsHandlers } from './handlers/analytics'
import { authHandlers } from './handlers/auth'
import { catalogHandlers } from './handlers/catalog'
import { clientHandlers } from './handlers/client'
import { orderHandlers } from './handlers/orders'
import { referenceHandlers } from './handlers/reference'
import { setupHandlers } from './handlers/setup'
import { shipmentHandlers } from './handlers/shipments'
import { staffHandlers } from './handlers/staff'
import { persist, restore } from './persist'

restore()

export const worker = setupWorker(
  ...authHandlers,
  ...clientHandlers,
  ...referenceHandlers,
  ...staffHandlers,
  ...setupHandlers,
  ...catalogHandlers,
  ...orderHandlers,
  ...shipmentHandlers,
  ...analyticsHandlers
)

// Save the DB after every change made through the API
worker.events.on('response:mocked', ({ request }) => {
  if (request.method !== 'GET') persist()
})
