import { lazy, Suspense } from 'react'
import { z } from 'zod'
import { AxiosError } from 'axios'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Loader2, LogIn } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { authApi, authKeys, type LoginResponse } from '@/api/auth'
import { API_MOCKS_ENABLED } from '@/api/config'
import { useAuthStore } from '@/stores/auth-store'
import { handleServerError } from '@/lib/handle-server-error'
import { isStaff } from '@/lib/permissions'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'

// Dev-only: `import.meta.env.DEV` inline keeps it out of the production bundle.
const DemoAccounts =
  import.meta.env.DEV && API_MOCKS_ENABLED
    ? lazy(() => import('@/api/mocks/demo-accounts'))
    : null

const formSchema = z.object({
  username: z.string().trim().min(1, 'auth.usernameRequired'),
  password: z.string().min(1, 'auth.passwordRequired'),
})

type FormValues = z.infer<typeof formSchema>

interface StaffSignInFormProps extends React.HTMLAttributes<HTMLFormElement> {
  redirectTo?: string
}

export function StaffSignInForm({
  className,
  redirectTo,
  ...props
}: StaffSignInFormProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { username: '', password: '' },
  })

  const signIn = useMutation({
    mutationFn: authApi.staffLogin,
    onSuccess: ({ access, user }: LoginResponse) => {
      if (!isStaff(user)) {
        form.setError('root', { message: t('auth.notStaff') })
        return
      }
      useAuthStore.getState().setAccessToken(access)
      queryClient.setQueryData(authKeys.me, user)
      toast.success(t('auth.welcome', { name: user.full_name }))
      navigate({ to: redirectTo || '/admin', replace: true })
    },
    onError: (error) => {
      const status = error instanceof AxiosError ? error.response?.status : 0
      if (status === 400 || status === 401) {
        form.setError('root', { message: t('auth.invalidCredentials') })
      } else if (status === 403) {
        form.setError('root', { message: t('auth.accountBlocked') })
      } else {
        handleServerError(error)
      }
    },
  })

  const rootError = form.formState.errors.root?.message

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => signIn.mutate(values))}
        className={cn('grid gap-3', className)}
        {...props}
      >
        <FormField
          control={form.control}
          name='username'
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('auth.username')}</FormLabel>
              <FormControl>
                <Input autoComplete='username' autoFocus {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('auth.password')}</FormLabel>
              <FormControl>
                <PasswordInput autoComplete='current-password' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {rootError && (
          <p role='alert' className='text-sm text-destructive'>
            {rootError}
          </p>
        )}
        <Button className='mt-2' disabled={signIn.isPending}>
          {signIn.isPending ? <Loader2 className='animate-spin' /> : <LogIn />}
          {t('auth.signIn')}
        </Button>

        {DemoAccounts && (
          <Suspense>
            <DemoAccounts
              onPick={(username, password) => {
                form.reset({ username, password })
              }}
            />
          </Suspense>
        )}
      </form>
    </Form>
  )
}
