import { type ColumnDef } from '@tanstack/react-table'
import { RowActions, type RowAction } from './row-actions'

/**
 * The "⋯" column. The same `getActions` also feeds the right-click context
 * menu of the row (DataTable finds it via `meta.rowActions`), so the actions
 * of a row are defined once.
 */
export function actionsColumn<TData>(
  getActions: (row: TData) => RowAction[]
): ColumnDef<TData> {
  return {
    id: 'actions',
    meta: { className: 'w-12', rowActions: getActions },
    cell: ({ row }) => <RowActions actions={getActions(row.original)} />,
  }
}
