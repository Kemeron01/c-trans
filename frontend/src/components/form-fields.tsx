import { type Control, type FieldValues, type Path } from 'react-hook-form'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

type TextFieldProps<T extends FieldValues> = {
  control: Control<T>
  name: Path<T>
  label: string
  description?: string
  /** Numeric fields: decimal keyboard on phones, value stays a string. */
  numeric?: boolean
} & Omit<React.ComponentProps<typeof Input>, 'name'>

/** Label + input + validation message for react-hook-form. */
export function TextField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  numeric,
  ...inputProps
}: TextFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              inputMode={numeric ? 'decimal' : undefined}
              {...inputProps}
              {...field}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
