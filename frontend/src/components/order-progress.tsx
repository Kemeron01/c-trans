import { Check, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { type Order } from '@/api/types'
import { progressOf } from '@/lib/order-flow'
import { cn } from '@/lib/utils'

/** Client progress bar (requirements 2.1, 5): steps of the order type. */
export function OrderProgress({
  order,
  compact,
}: {
  order: Order
  compact?: boolean
}) {
  const { t } = useTranslation()
  const { steps, current, stopped } = progressOf(order)
  const done = order.status === 'delivered'

  if (compact) {
    const percent = done
      ? 100
      : Math.round((current / (steps.length - 1)) * 100)
    return (
      <div className='grid gap-1'>
        <div className='h-1.5 overflow-hidden rounded-full bg-muted'>
          <div
            className={cn(
              'h-full rounded-full',
              stopped ? 'bg-muted-foreground' : 'bg-primary'
            )}
            style={{ width: `${Math.max(percent, 4)}%` }}
          />
        </div>
      </div>
    )
  }

  return (
    <ol className='grid gap-3 sm:flex sm:gap-0'>
      {steps.map((step, i) => {
        const passed = i < current || (i === current && done)
        const active = i === current && !done
        return (
          <li
            key={step}
            className='flex items-center gap-3 sm:flex-1 sm:flex-col sm:gap-2 sm:text-center'
          >
            <div className='flex w-full items-center sm:flex-row'>
              <span
                className={cn(
                  'hidden h-0.5 flex-1 sm:block',
                  i === 0
                    ? 'invisible'
                    : i <= current
                      ? 'bg-primary'
                      : 'bg-muted'
                )}
              />
              <span
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-medium',
                  passed && 'border-primary bg-primary text-primary-foreground',
                  active && !stopped && 'border-primary text-primary',
                  active &&
                    stopped &&
                    'border-destructive bg-destructive text-white',
                  !passed && !active && 'border-muted text-muted-foreground'
                )}
              >
                {passed ? (
                  <Check className='size-4' />
                ) : active && stopped ? (
                  <X className='size-4' />
                ) : (
                  i + 1
                )}
              </span>
              <span
                className={cn(
                  'hidden h-0.5 flex-1 sm:block',
                  i === steps.length - 1
                    ? 'invisible'
                    : i < current
                      ? 'bg-primary'
                      : 'bg-muted'
                )}
              />
            </div>
            <span
              className={cn(
                'text-sm sm:text-xs',
                active ? 'font-medium' : 'text-muted-foreground'
              )}
            >
              {t(`progress.${step}` as 'progress.delivered')}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
