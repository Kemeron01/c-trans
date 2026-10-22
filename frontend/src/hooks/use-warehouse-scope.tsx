import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { warehousesQuery } from '@/api/reference'
import { type WarehouseKind } from '@/api/types'
import { useCurrentUser } from '@/hooks/use-current-user'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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
    <Select
      value={warehouseId ? String(warehouseId) : undefined}
      onValueChange={(v) => setPicked(Number(v))}
    >
      <SelectTrigger className='w-56' aria-label={t('staff.warehouse')}>
        <SelectValue placeholder={t('staff.warehouse')} />
      </SelectTrigger>
      <SelectContent>
        {options.map((w) => (
          <SelectItem key={w.id} value={String(w.id)}>
            {w.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ) : null

  return { warehouseId, picker, canEdit: user.role !== 'worker' }
}
