import { cn } from '@/lib/utils'
import { PaginationLink } from '@/components/ui/pagination'

/** One page control of the animated Pagination: acts like a button, not a URL. */
export function PageLink({
  label,
  isActive,
  disabled,
  onSelect,
  children,
}: {
  label: string
  isActive?: boolean
  disabled?: boolean
  onSelect: () => void
  children: React.ReactNode
}) {
  return (
    <PaginationLink
      href='#'
      role='button'
      aria-label={label}
      aria-disabled={disabled || undefined}
      data-disabled={disabled || undefined}
      isActive={isActive}
      tabIndex={disabled ? -1 : 0}
      className={cn(
        'size-8 min-w-8 px-2 text-sm',
        isActive && 'font-semibold',
        disabled && 'pointer-events-none opacity-50'
      )}
      onClick={(e) => {
        e.preventDefault()
        if (!disabled) onSelect()
      }}
    >
      {children}
    </PaginationLink>
  )
}
