import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { userRequestsApi, userRequestsQuery } from '@/api/staff'
import { type UserRequest } from '@/api/types'
import { applyServerErrors } from '@/lib/form-errors'
import { emptyToNull } from '@/lib/format'
import { requiredString } from '@/lib/validation'
import { useCurrentUser } from '@/hooks/use-current-user'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { FormDialog } from '@/components/form-dialog'
import { CredentialsFields, ProfileFields } from '../admins/account-fields'
import { credentialsShape, profileShape } from '../admins/account-schema'

const requestSchema = z.object({ ...profileShape, ...credentialsShape })
type RequestValues = z.infer<typeof requestSchema>

function useInvalidateRequests() {
  const queryClient = useQueryClient()
  return () =>
    queryClient.invalidateQueries({ queryKey: userRequestsQuery().queryKey })
}

/** Admin asks the super-admin to create a worker for the admin's warehouse. */
export function NewRequestDialog({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const user = useCurrentUser()
  const invalidate = useInvalidateRequests()
  const form = useForm<RequestValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      full_name: '',
      phone: '',
      email: '',
      username: '',
      password: '',
    },
  })

  const create = useMutation({
    mutationFn: (v: RequestValues) =>
      userRequestsApi.create({
        ...v,
        phone: emptyToNull(v.phone),
        email: emptyToNull(v.email),
      }),
    onSuccess: () => {
      invalidate()
      toast.success(t('userRequests.sent'))
      onClose()
    },
    onError: (error) => applyServerErrors(error, form),
  })

  return (
    <FormDialog
      open
      onOpenChange={onClose}
      title={t('userRequests.add')}
      description={t('userRequests.addDescription', {
        warehouse: user.warehouse?.name ?? '',
      })}
      formId='request-form'
      submitText={t('userRequests.send')}
      isPending={create.isPending}
    >
      <Form {...form}>
        <form
          id='request-form'
          onSubmit={form.handleSubmit((v) => create.mutate(v))}
          className='grid gap-4'
        >
          <ProfileFields control={form.control} />
          <CredentialsFields control={form.control} />
        </form>
      </Form>
    </FormDialog>
  )
}

const rejectSchema = z.object({ reason: requiredString() })

export function RejectDialog({
  request,
  onClose,
}: {
  request: UserRequest
  onClose: () => void
}) {
  const { t } = useTranslation()
  const invalidate = useInvalidateRequests()
  const form = useForm<z.infer<typeof rejectSchema>>({
    resolver: zodResolver(rejectSchema),
    defaultValues: { reason: '' },
  })

  const reject = useMutation({
    mutationFn: ({ reason }: z.infer<typeof rejectSchema>) =>
      userRequestsApi.reject(request.id, reason),
    onSuccess: () => {
      invalidate()
      toast.success(t('userRequests.rejectedToast'))
      onClose()
    },
    onError: (error) => applyServerErrors(error, form),
  })

  return (
    <FormDialog
      open
      onOpenChange={onClose}
      title={t('userRequests.reject')}
      description={`${request.full_name} · ${request.username}`}
      formId='reject-form'
      submitText={t('userRequests.reject')}
      isPending={reject.isPending}
    >
      <Form {...form}>
        <form
          id='reject-form'
          onSubmit={form.handleSubmit((v) => reject.mutate(v))}
        >
          <FormField
            control={form.control}
            name='reason'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('userRequests.reason')}</FormLabel>
                <FormControl>
                  <Textarea rows={3} {...field} />
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
