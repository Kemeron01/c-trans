import { type z } from 'zod'
import { type Control, type FieldValues, type Path } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'
import { type credentialsShape, type profileShape } from './account-schema'

type Profile = z.infer<z.ZodObject<typeof profileShape>>
type Credentials = z.infer<z.ZodObject<typeof credentialsShape>>

type FieldsProps<T extends FieldValues> = { control: Control<T> }

export function CredentialsFields<T extends Credentials & FieldValues>({
  control,
}: FieldsProps<T>) {
  const { t } = useTranslation()
  return (
    <div className='grid gap-4 sm:grid-cols-2'>
      <FormField
        control={control}
        name={'username' as Path<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('staff.username')}</FormLabel>
            <FormControl>
              <Input autoComplete='off' {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={'password' as Path<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('staff.password')}</FormLabel>
            <FormControl>
              <PasswordInput autoComplete='new-password' {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormDescription className='sm:col-span-2'>
        {t('staff.credentialsHint')}
      </FormDescription>
    </div>
  )
}

export function ProfileFields<T extends Profile & FieldValues>({
  control,
}: FieldsProps<T>) {
  const { t } = useTranslation()
  const input = (name: keyof Profile, label: string, type = 'text') => (
    <FormField
      control={control}
      name={name as Path<T>}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input type={type} {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
  return (
    <>
      {input('full_name', t('staff.fullName'))}
      <div className='grid gap-4 sm:grid-cols-2'>
        {input('phone', t('staff.phone'), 'tel')}
        {input('email', t('staff.email'), 'email')}
      </div>
    </>
  )
}
