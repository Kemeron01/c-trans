import {
  countries,
  courierTariffs,
  products,
  settings,
  stockMovements,
  tariffs,
  userRequests,
  users,
  warehouses,
} from './db'
import { cards, notifications } from './db-client'
import { orders, reviews, shipments } from './db-orders'

// The mock DB lives in memory; without this every page reload would reset
// it (created orders and shipments disappear). Saved to localStorage after
// each change, restored on start, cleared with "Reset demo data".

const KEY = 'ct_mock_db_v1'

const stores: Record<string, unknown[]> = {
  countries,
  warehouses,
  users,
  userRequests,
  settings,
  tariffs,
  courierTariffs,
  products,
  stockMovements,
  orders,
  shipments,
  reviews,
  cards,
  notifications,
}

export function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(stores))
  } catch {
    // Quota or blocked storage: the demo simply won't survive a reload
  }
}

export function restore() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (!saved) return
    for (const [name, items] of Object.entries(stores)) {
      if (Array.isArray(saved[name]))
        items.splice(0, items.length, ...saved[name])
    }
    // Uploaded photos were object URLs of the previous page
    for (const p of products) {
      if (p.photo_url?.startsWith('blob:')) p.photo_url = null
    }
  } catch {
    // Corrupted snapshot: keep the seed
  }
}

export function resetMockDb() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
  location.reload()
}
