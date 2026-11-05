import '@tanstack/react-table'
import { type RowAction } from '@/components/data-table/row-actions'

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    className?: string // apply to both th and td
    label?: string // column name in the "View" menu (defaults to column id)
    tdClassName?: string
    thClassName?: string
    /** Row actions: shown in the "⋯" menu and the right-click menu. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rowActions?: (row: any) => RowAction[]
  }
}
