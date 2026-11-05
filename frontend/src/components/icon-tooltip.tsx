import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

/** Caption for an icon-only control: wraps the control (`children`, one element). */
export function IconTooltip({
  label,
  children,
  side = 'bottom',
}: {
  label: string
  children: React.ReactElement
  side?: 'top' | 'bottom' | 'left' | 'right'
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side}>{label}</TooltipContent>
    </Tooltip>
  )
}
