import { useState } from 'react'
import { Check, ChevronsUpDown, Loader } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { FormControl } from '@/components/ui/form'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

type ComboboxProps = {
  value: string | undefined
  onValueChange: (value: string) => void
  items: { label: string; value: string }[] | undefined
  placeholder?: string
  isPending?: boolean
  disabled?: boolean
  className?: string
  /** Inside a react-hook-form <FormField>: links the trigger to the label. */
  inForm?: boolean
  'aria-label'?: string
}

/**
 * Select with search for lists that grow (warehouses, countries):
 * Popover + Command. Same props as SelectDropdown, controlled only.
 */
export function Combobox({
  value,
  onValueChange,
  items,
  placeholder,
  isPending,
  disabled,
  className,
  inForm,
  'aria-label': ariaLabel,
}: ComboboxProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const selected = items?.find((i) => i.value === value)

  const trigger = (
    <Button
      type='button'
      variant='outline'
      role='combobox'
      aria-expanded={open}
      aria-label={ariaLabel}
      disabled={disabled}
      className={cn('justify-between font-normal', className)}
    >
      <span className={cn('truncate', !selected && 'text-muted-foreground')}>
        {selected?.label ?? placeholder ?? t('common.select')}
      </span>
      <ChevronsUpDown className='ms-2 size-4 shrink-0 opacity-50' />
    </Button>
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {inForm ? <FormControl>{trigger}</FormControl> : trigger}
      </PopoverTrigger>
      <PopoverContent
        className='w-(--radix-popover-trigger-width) min-w-56 p-0'
        align='start'
      >
        <Command>
          <CommandInput placeholder={t('common.search')} />
          <CommandList>
            {isPending ? (
              <div className='flex items-center justify-center gap-2 py-6 text-sm'>
                <Loader className='size-4 animate-spin' />
                {t('common.loading')}
              </div>
            ) : (
              <>
                <CommandEmpty>{t('dataTable.noResults')}</CommandEmpty>
                <CommandGroup>
                  {items?.map((item) => (
                    <CommandItem
                      key={item.value}
                      value={item.label}
                      onSelect={() => {
                        onValueChange(item.value)
                        setOpen(false)
                      }}
                    >
                      {item.label}
                      <Check
                        className={cn(
                          'ms-auto size-4',
                          item.value === value ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
