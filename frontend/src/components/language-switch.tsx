import { Check, Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LANGUAGES } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function LanguageSwitch() {
  const { t, i18n } = useTranslation()

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='sm' className='gap-1.5 rounded-full'>
          <Languages className='size-[1.1rem]' />
          <span className='text-xs font-semibold uppercase'>
            {i18n.language}
          </span>
          <span className='sr-only'>{t('language.label')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        {LANGUAGES.map((lng) => (
          <DropdownMenuItem key={lng} onClick={() => i18n.changeLanguage(lng)}>
            {t(`language.${lng}`)}
            <Check
              size={14}
              className={cn('ms-auto', i18n.language !== lng && 'hidden')}
            />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
