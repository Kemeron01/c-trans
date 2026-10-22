type PageHeadingProps = {
  title: string
  description?: string
  /** Primary actions on the right (e.g. "Add" button). */
  children?: React.ReactNode
}

export function PageHeading({
  title,
  description,
  children,
}: PageHeadingProps) {
  return (
    <div className='flex flex-wrap items-end justify-between gap-2'>
      <div>
        <h2 className='text-2xl font-bold tracking-tight'>{title}</h2>
        {description && <p className='text-muted-foreground'>{description}</p>}
      </div>
      {children && <div className='flex gap-2'>{children}</div>}
    </div>
  )
}
