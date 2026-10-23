import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { users } from './db'
import { MOCK_OTP } from './db-client'
import { resetMockDb } from './persist'

/** Dev-only helper on the client sign-in page. */
export default function DemoPhones({
  onPick,
}: {
  onPick: (phone: string) => void
}) {
  const { t } = useTranslation()
  return (
    <div className='space-y-2 rounded-md border border-dashed p-3 text-sm'>
      <p className='text-muted-foreground'>
        {t('auth.demoPhones', { code: MOCK_OTP })}
      </p>
      <div className='grid gap-1'>
        {users
          .filter((u) => u.role === 'client')
          .map((u) => (
            <Button
              key={u.id}
              type='button'
              variant='ghost'
              size='sm'
              className='h-auto justify-between py-1'
              onClick={() => onPick(u.phone ?? '')}
            >
              <span className='font-mono'>{u.phone}</span>
              <span className='text-xs text-muted-foreground'>
                {u.full_name || u.client_code}
              </span>
            </Button>
          ))}
      </div>
      <Button
        type='button'
        variant='link'
        size='sm'
        className='h-auto px-0'
        onClick={resetMockDb}
      >
        {t('auth.resetDemo')}
      </Button>
    </div>
  )
}
