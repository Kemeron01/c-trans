import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { warehousesQuery } from '@/api/reference'
import { type WarehouseKind } from '@/api/types'
import { useCurrentUser } from '@/hooks/use-current-user'
import { Combobox } from '@/components/combobox'

/**
 * Warehouse a warehouse-scoped page works with. Admins and workers: their
 * own. Super-admin: picks one of the warehouses of the given kind.
 */
export function useWarehouseScope(kind: WarehouseKind) {
  const { t } = useTranslation()
  const user = useCurrentUser()
  const isSuper = user.role === 'super_admin'
  const warehouses = useQuery({ ...warehousesQuery(), enabled: isSuper })
  const options = (warehouses.data ?? []).filter(
    (w) => w.kind === kind && w.is_active
  )
  const [picked, setPicked] = useState<number | null>(null)

  const warehouseId = isSuper
    ? (picked ?? options[0]?.id ?? null)
    : (user.warehouse?.id ?? null)

  const picker = isSuper ? (
    <Combobox
      value={warehouseId ? String(warehouseId) : undefined}
      onValueChange={(v) => setPicked(Number(v))}
      aria-label={t('staff.warehouse')}
      placeholder={t('staff.warehouse')}
      className='w-56'
      items={options.map((w) => ({ value: String(w.id), label: w.name }))}
    />
  ) : null

  return { warehouseId, picker, canEdit: user.role !== 'worker' }
}
