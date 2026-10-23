import { lazy, Suspense, useEffect, useState } from 'react'
import { AxiosError } from 'axios'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { otpApi } from '@/api/account'
import { authKeys } from '@/api/auth'
import { API_MOCKS_ENABLED } from '@/api/config'
import { type ApiErrorBody } from '@/api/types'
import { useAuthStore } from '@/stores/auth-store'
import { handleServerError } from '@/lib/handle-server-error'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp'
import { Label } from '@/components/ui/label'
import { AuthLayout } from '../auth/auth-layout'

// Dev-only: `import.meta.env.DEV` inline keeps it out of the production bundle.
const DemoPhones =
  import.meta.env.DEV && API_MOCKS_ENABLED
    ? lazy(() => import('@/api/mocks/demo-phones'))
    : null

const route = getRouteApi('/sign-in')

/** First error message of a DRF 400 response, if any. */
function fieldMessage(error: unknown) {
  if (!(error instanceof AxiosError) || error.response?.status !== 400)
    return null
  const data = error.response.data as ApiErrorBody
  const first = Object.values(data ?? {})[0]
  return Array.isArray(first)
    ? String(first[0])
    : typeof first === 'string'
      ? first
      : null
}

/** Client sign-in: phone + SMS code, no password (section 9). */
export function ClientSignIn() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { redirect } = route.useSearch()
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'phone' | 'code'>('phone')
  const [resendIn, setResendIn] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (resendIn <= 0) return
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendIn])

  const request = useMutation({
    mutationFn: () => otpApi.request(phone),
    onSuccess: ({ resend_in }) => {
      setError(null)
      setStep('code')
      setCode('')
      setResendIn(resend_in)
    },
    onError: (e) => {
      const message = fieldMessage(e)
      if (message) setError(message)
      else handleServerError(e)
    },
  })

  const verify = useMutation({
    mutationFn: (value: string) => otpApi.verify(phone, value),
    onSuccess: ({ access, user, is_new }) => {
      useAuthStore.getState().setAccessToken(access)
      queryClient.setQueryData(authKeys.me, user)
      // New clients fill the profile first (scenario 1)
      if (is_new || !user.full_name)
        navigate({ to: '/account', search: { welcome: true } })
      else navigate({ to: redirect || '/orders', replace: true })
    },
    onError: (e) => {
      setCode('')
      const message = fieldMessage(e)
      if (message) setError(message)
      else if (e instanceof AxiosError && e.response?.status === 429) {
        setError(t('clientAuth.tooManyAttempts'))
        setStep('phone')
      } else handleServerError(e)
    },
  })

  return (
    <AuthLayout>
      <Card className='w-full max-w-sm gap-4'>
        <CardHeader>
          <CardTitle className='text-lg tracking-tight'>
            {t('clientAuth.title')}
          </CardTitle>
          <CardDescription>
            {step === 'phone'
              ? t('clientAuth.phoneHint')
              : t('clientAuth.codeHint', { phone })}
          </CardDescription>
        </CardHeader>
        <CardContent className='grid gap-4'>
          {step === 'phone' ? (
            <form
              className='grid gap-3'
              onSubmit={(e) => {
                e.preventDefault()
                request.mutate()
              }}
            >
              <div className='grid gap-2'>
                <Label htmlFor='phone'>{t('clientAuth.phone')}</Label>
                <Input
                  id='phone'
                  type='tel'
                  autoComplete='tel'
                  placeholder='+998 90 123 45 67'
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  aria-invalid={!!error}
                  autoFocus
                />
              </div>
              {error && (
                <p role='alert' className='text-sm text-destructive'>
                  {error}
                </p>
              )}
              <Button disabled={request.isPending || !phone.trim()}>
                {request.isPending && <Loader2 className='animate-spin' />}
                {t('clientAuth.getCode')}
              </Button>
            </form>
          ) : (
            <div className='grid gap-3'>
              <Label htmlFor='otp'>{t('clientAuth.code')}</Label>
              <InputOTP
                id='otp'
                maxLength={6}
                value={code}
                onChange={setCode}
                onComplete={(value) => verify.mutate(value)}
                disabled={verify.isPending}
                autoFocus
              >
                <InputOTPGroup>
                  {Array.from({ length: 6 }, (_, i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
              {error && (
                <p role='alert' className='text-sm text-destructive'>
                  {error}
                </p>
              )}
              <Button
                disabled={verify.isPending || code.length !== 6}
                onClick={() => verify.mutate(code)}
              >
                {verify.isPending && <Loader2 className='animate-spin' />}
                {t('clientAuth.signIn')}
              </Button>
              <div className='flex justify-between text-sm'>
                <Button
                  variant='link'
                  className='h-auto px-0'
                  onClick={() => setStep('phone')}
                >
                  {t('clientAuth.changePhone')}
                </Button>
                <Button
                  variant='link'
                  className='h-auto px-0'
                  disabled={resendIn > 0 || request.isPending}
                  onClick={() => request.mutate()}
                >
                  {resendIn > 0
                    ? t('clientAuth.resendIn', { seconds: resendIn })
                    : t('clientAuth.resend')}
                </Button>
              </div>
            </div>
          )}
          {DemoPhones && step === 'phone' && (
            <Suspense>
              <DemoPhones onPick={setPhone} />
            </Suspense>
          )}
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
