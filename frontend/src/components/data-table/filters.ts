import { type Row } from '@tanstack/react-table'

/** Column filterFn for faceted filters: the cell value is one of the selected. */
export function inSelected<TData>(
  row: Row<TData>,
  columnId: string,
  selected: unknown
) {
  return (
    !Array.isArray(selected) ||
    selected.includes(String(row.getValue(columnId)))
  )
}
