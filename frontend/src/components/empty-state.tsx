import { SearchX } from 'lucide-react'

type EmptyStateProps = {
  title: string
  description?: string
  icon?: React.ElementType
  children?: React.ReactNode
}

/** "Nothing here" block: not found, no access, empty list. */
export function EmptyState({
  title,
  description,
  icon: Icon = SearchX,
  children,
}: EmptyStateProps) {
  return (
    <div className='flex min-h-64 flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center'>
      <Icon className='size-10 text-muted-foreground' />
      <div className='font-medium'>{title}</div>
      {description && (
        <p className='max-w-sm text-sm text-muted-foreground'>{description}</p>
      )}
      {children}
    </div>
  )
}
