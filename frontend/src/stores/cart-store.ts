import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// One order = one warehouse (open question 3, default): the cart holds
// products of a single foreign warehouse.

type CartLine = { product_id: number; quantity: number }

interface CartState {
  warehouseId: number | null
  lines: CartLine[]
  /** false when the cart holds another warehouse's goods (caller asks first). */
  add: (warehouseId: number, productId: number) => boolean
  setQuantity: (productId: number, quantity: number) => void
  replaceWith: (warehouseId: number, productId: number) => void
  clear: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      warehouseId: null,
      lines: [],
      add: (warehouseId, productId) => {
        const { warehouseId: current, lines } = get()
        if (current !== null && current !== warehouseId && lines.length) {
          return false
        }
        const line = lines.find((l) => l.product_id === productId)
        set({
          warehouseId,
          lines: line
            ? lines.map((l) =>
                l === line ? { ...l, quantity: l.quantity + 1 } : l
              )
            : [...lines, { product_id: productId, quantity: 1 }],
        })
        return true
      },
      setQuantity: (productId, quantity) =>
        set(({ lines, warehouseId }) => {
          const next =
            quantity > 0
              ? lines.map((l) =>
                  l.product_id === productId ? { ...l, quantity } : l
                )
              : lines.filter((l) => l.product_id !== productId)
          return { lines: next, warehouseId: next.length ? warehouseId : null }
        }),
      replaceWith: (warehouseId, productId) =>
        set({ warehouseId, lines: [{ product_id: productId, quantity: 1 }] }),
      clear: () => set({ warehouseId: null, lines: [] }),
    }),
    { name: 'ct_cart' }
  )
)
