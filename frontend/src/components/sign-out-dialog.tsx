import { useTranslation } from 'react-i18next'
import { useSignOut } from '@/hooks/use-sign-out'
import { ConfirmDialog } from '@/components/confirm-dialog'

interface SignOutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  redirectTo?: '/admin/sign-in' | '/'
}

export function SignOutDialog({
  open,
  onOpenChange,
  redirectTo,
}: SignOutDialogProps) {
  const { t } = useTranslation()
  const signOut = useSignOut(redirectTo)

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('auth.signOutTitle')}
      desc={t('auth.signOutConfirm')}
      confirmText={t('auth.signOut')}
      destructive
      handleConfirm={signOut}
      className='sm:max-w-sm'
    />
  )
}
