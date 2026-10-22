import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export type RowAction = {
  label: string
  icon?: React.ElementType
  onSelect: () => void
  destructive?: boolean
  hidden?: boolean
}

/** "⋯" menu in the last table column. */
export function RowActions({ actions }: { actions: RowAction[] }) {
  const { t } = useTranslation()
  const visible = actions.filter((a) => !a.hidden)
  if (!visible.length) return null
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='size-8 p-0'>
          <DotsHorizontalIcon className='size-4' />
          <span className='sr-only'>{t('common.actions')}</span>
        </Button>
      </DropdownMenuTrigger>
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
