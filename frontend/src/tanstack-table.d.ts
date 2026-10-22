import '@tanstack/react-table'

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    className?: string // apply to both th and td
    label?: string // column name in the "View" menu (defaults to column id)
    tdClassName?: string
    thClassName?: string
  }
}
