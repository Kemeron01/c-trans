import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Bell } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { clientApi, notificationsQuery } from '@/api/account'
import { type AppNotification } from '@/api/types'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { IconTooltip } from '@/components/icon-tooltip'

/** Site notifications (section 10); SMS copies are sent by the backend. */
export function NotificationsBell() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data = [] } = useQuery(notificationsQuery())
  const isMobile = useIsMobile()
  const unread = data.filter((n) => !n.is_read).length
  const markRead = useMutation({
    mutationFn: clientApi.markRead,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: notificationsQuery().queryKey,
      }),
  })

  const text = (n: AppNotification) =>
    n.kind === 'payment_failed'
      ? t('notifications.paymentFailed', { number: n.order_number })
      : t('notifications.status', {
          number: n.order_number,
          status: n.status ? t(`orderStatus.${n.status}`) : '',
        })

  const [open, setOpen] = useState(false)
  const onOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next && unread) markRead.mutate()
  }

  const trigger = (
    <Button variant='ghost' size='icon' className='relative rounded-full'>
      <Bell />
      {unread > 0 && (
        <span className='absolute end-1 top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-white'>
          {unread > 9 ? '9+' : unread}
        </span>
      )}
      <span className='sr-only'>{t('notifications.title')}</span>
    </Button>
  )

  const list = (
    <ul className='max-h-96 overflow-y-auto'>
      {data.map((n) => (
        <li key={n.id}>
          <button
            type='button'
            className={cn(
              'grid w-full gap-0.5 border-b px-4 py-3 text-start text-sm hover:bg-accent',
              !n.is_read && 'bg-accent/50'
            )}
            onClick={() => {
              onOpenChange(false)
              navigate({
                to: '/orders/$orderId',
                params: { orderId: String(n.order_id) },
              })
            }}
          >
            <span>{text(n)}</span>
            <span className='text-xs text-muted-foreground'>
              {formatDateTime(n.created_at)}
            </span>
          </button>
        </li>
      ))}
      {!data.length && (
        <li className='px-4 py-6 text-center text-sm text-muted-foreground'>
          {t('notifications.empty')}
        </li>
      )}
    </ul>
  )

  // Phones: a bottom Drawer; larger screens: a Popover under the bell
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{t('notifications.title')}</DrawerTitle>
          </DrawerHeader>
          <div className='overflow-y-auto pb-4'>{list}</div>
        </DrawerContent>
      </Drawer>
    )
  }
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <IconTooltip label={t('notifications.title')}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      </IconTooltip>
      <PopoverContent align='end' className='w-80 p-0'>
        <div className='border-b px-4 py-3 text-sm font-medium'>
          {t('notifications.title')}
        </div>
        {list}
      </PopoverContent>
    </Popover>
  )
}
