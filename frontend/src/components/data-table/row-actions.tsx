import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { IconTooltip } from '@/components/icon-tooltip'

export type RowAction = {
  label: string
  icon?: React.ElementType
  onSelect: () => void
  destructive?: boolean
  hidden?: boolean
}

/** Right-click menu of a table row: the same actions as the "⋯" menu. */
export function RowContextMenu({
  actions,
  children,
}: {
  actions: RowAction[]
  children: React.ReactElement
}) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className='min-w-44'>
        {actions
          .filter((a) => !a.hidden)
          .map(({ label, icon: Icon, onSelect, destructive }) => (
            <ContextMenuItem
              key={label}
              onSelect={onSelect}
              variant={destructive ? 'destructive' : 'default'}
            >
              {Icon && <Icon />}
              {label}
            </ContextMenuItem>
          ))}
      </ContextMenuContent>
    </ContextMenu>
  )
}

/** "⋯" menu in the last table column. */
export function RowActions({ actions }: { actions: RowAction[] }) {
  const { t } = useTranslation()
  const visible = actions.filter((a) => !a.hidden)
  if (!visible.length) return null
  return (
    <DropdownMenu modal={false}>
      <IconTooltip label={t('common.actions')}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='size-8 p-0'>
            <DotsHorizontalIcon className='size-4' />
            <span className='sr-only'>{t('common.actions')}</span>
          </Button>
        </DropdownMenuTrigger>
      </IconTooltip>
      <DropdownMenuContent align='end' className='min-w-40'>
        {visible.map(({ label, icon: Icon, onSelect, destructive }) => (
          <DropdownMenuItem
            key={label}
            onClick={onSelect}
            variant={destructive ? 'destructive' : 'default'}
          >
            {Icon && <Icon />}
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
