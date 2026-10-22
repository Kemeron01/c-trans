import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { warehousesQuery } from '@/api/reference'
import { adminsApi, adminsQuery } from '@/api/staff'
import { type StaffAccount } from '@/api/types'
import { applyServerErrors } from '@/lib/form-errors'
import { emptyToNull } from '@/lib/format'
import { requiredString } from '@/lib/validation'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { FormDialog } from '@/components/form-dialog'
import { SelectDropdown } from '@/components/select-dropdown'
import { CredentialsFields, ProfileFields } from './account-fields'
import { credentialsShape, profileShape } from './account-schema'

const editSchema = z.object({ ...profileShape, warehouse_id: requiredString() })
const createSchema = editSchema.extend(credentialsShape)

type FormValues = z.infer<typeof createSchema>

type AdminDialogProps = {
  admin?: StaffAccount
  onClose: () => void
}

export function AdminDialog({ admin, onClose }: AdminDialogProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const warehouses = useQuery(warehousesQuery())

  // Editing has no username/password: validate with the smaller schema
  const form = useForm<FormValues>({
    resolver: zodResolver(admin ? editSchema : createSchema) as never,
    defaultValues: {
      full_name: admin?.full_name ?? '',
      phone: admin?.phone ?? '',
      email: admin?.email ?? '',
      warehouse_id: admin?.warehouse ? String(admin.warehouse.id) : '',
      username: '',
      password: '',
    },
  })

  const save = useMutation({
    mutationFn: (values: FormValues) => {
      const profile = {
        full_name: values.full_name,
        phone: emptyToNull(values.phone),
        email: emptyToNull(values.email),
        warehouse_id: Number(values.warehouse_id),
      }
      return admin
        ? adminsApi.update(admin.id, profile)
        : adminsApi.create({
            ...profile,
            username: values.username,
            password: values.password,
          })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminsQuery().queryKey })
      toast.success(t(admin ? 'common.saved' : 'common.created'))
      onClose()
    },
    onError: (error) => applyServerErrors(error, form),
  })

  return (
    <FormDialog
      open
      onOpenChange={onClose}
      title={t(admin ? 'admins.edit' : 'admins.add')}
      description={admin ? `${admin.username}` : undefined}
      formId='admin-form'
      isPending={save.isPending}
    >
      <Form {...form}>
        <form
          id='admin-form'
          onSubmit={form.handleSubmit((v) => save.mutate(v))}
          className='grid gap-4'
        >
          <ProfileFields control={form.control} />
          <FormField
            control={form.control}
            name='warehouse_id'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('staff.warehouse')}</FormLabel>
                <SelectDropdown
                  isControlled
                  defaultValue={field.value}
                  onValueChange={field.onChange}
                  isPending={warehouses.isLoading}
                  className='w-full'
                  items={warehouses.data
                    ?.filter((w) => w.is_active || String(w.id) === field.value)
                    .map((w) => ({
                      value: String(w.id),
                      label: `${w.name} · ${t(`warehouseKind.${w.kind}`)}`,
                    }))}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          {!admin && <CredentialsFields control={form.control} />}
        </form>
      </Form>
    </FormDialog>
  )
}
