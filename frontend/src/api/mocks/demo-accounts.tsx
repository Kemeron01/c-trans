import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { MOCK_PASSWORD, users, warehouseSummary } from './db'
import { resetMockDb } from './persist'

type DemoAccountsProps = {
  onPick: (username: string, password: string) => void
}

/** Dev-only helper on the sign-in page: one click fills a mock account. */
export default function DemoAccounts({ onPick }: DemoAccountsProps) {
  const { t } = useTranslation()
  return (
    <div className='space-y-2 rounded-md border border-dashed p-3 text-sm'>
      <p className='text-muted-foreground'>
        {t('auth.demoAccounts', { password: MOCK_PASSWORD })}
      </p>
      <div className='grid gap-1'>
        {users
          .filter((user) => user.role !== 'client')
          .map((user) => (
            <Button
              key={user.id}
              type='button'
              variant='ghost'
              size='sm'
              className='h-auto justify-between py-1'
              onClick={() => onPick(user.username ?? '', user.password)}
            >
              <span className='font-mono'>{user.username}</span>
              <span className='text-xs text-muted-foreground'>
                {t(`roles.${user.role}`)}
                {user.warehouse_id &&
                  ` · ${warehouseSummary(user.warehouse_id)?.name}`}
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
