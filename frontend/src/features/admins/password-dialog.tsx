import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { adminsApi } from '@/api/staff'
import { type StaffAccount } from '@/api/types'
import { applyServerErrors } from '@/lib/form-errors'
import { passwordSchema } from '@/lib/validation'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { FormDialog } from '@/components/form-dialog'
import { PasswordInput } from '@/components/password-input'

const schema = z.object({ password: passwordSchema() })

/** Super-admin sets a new password for an admin (admins cannot change it themselves). */
export function PasswordDialog({
  admin,
  onClose,
}: {
  admin: StaffAccount
  onClose: () => void
}) {
  const { t } = useTranslation()
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { password: '' },
  })

  const save = useMutation({
    mutationFn: ({ password }: z.infer<typeof schema>) =>
      adminsApi.setPassword(admin.id, password),
    onSuccess: () => {
      toast.success(t('staff.passwordChanged'))
      onClose()
    },
    onError: (error) => applyServerErrors(error, form),
  })

  return (
    <FormDialog
      open
      onOpenChange={onClose}
      title={t('staff.setPassword')}
      description={`${admin.full_name} · ${admin.username}`}
      formId='password-form'
      isPending={save.isPending}
    >
      <Form {...form}>
        <form
          id='password-form'
          onSubmit={form.handleSubmit((v) => save.mutate(v))}
        >
          <FormField
            control={form.control}
            name='password'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('staff.newPassword')}</FormLabel>
                <FormControl>
                  <PasswordInput autoComplete='new-password' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </FormDialog>
  )
}
