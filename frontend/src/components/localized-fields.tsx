import { type Control, type FieldValues, type Path } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { LANGUAGES } from '@/lib/i18n'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

type LocalizedFieldsProps<T extends FieldValues> = {
  control: Control<T>
  /** Form field holding a LocalizedText object, e.g. "name". */
  name: Path<T>
  label: string
}

/** Three inputs (ru / uz / en) for a LocalizedText value. */
export function LocalizedFields<T extends FieldValues>({
  control,
  name,
  label,
}: LocalizedFieldsProps<T>) {
  const { t } = useTranslation()
  return (
    <fieldset className='grid gap-3'>
      <legend className='mb-2 text-sm font-medium'>{label}</legend>
      {LANGUAGES.map((lng) => (
        <FormField
          key={lng}
          control={control}
          name={`${name}.${lng}` as Path<T>}
          render={({ field }) => (
            <FormItem className='grid grid-cols-[6rem_1fr] items-center gap-x-3'>
              <FormLabel className='text-muted-foreground'>
                {t(`language.${lng}`)}
              </FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage className='col-start-2' />
            </FormItem>
          )}
        />
      ))}
    </fieldset>
  )
}
