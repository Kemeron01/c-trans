import { getRouteApi } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AuthLayout } from '../auth-layout'
import { StaffSignInForm } from './components/staff-sign-in-form'

const route = getRouteApi('/admin/sign-in')

export function StaffSignIn() {
  const { t } = useTranslation()
  const { redirect } = route.useSearch()

  return (
    <AuthLayout>
      <Card className='max-w-sm gap-4'>
        <CardHeader>
          <CardTitle className='text-lg tracking-tight'>
            {t('auth.staffTitle')}
          </CardTitle>
          <CardDescription>{t('auth.staffDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <StaffSignInForm redirectTo={redirect} />
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
