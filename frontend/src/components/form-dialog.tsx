import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type FormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  /** id of the <form> inside: the submit button is outside it, in the footer. */
  formId: string
  submitText?: string
  isPending?: boolean
  children: React.ReactNode
}

/** Dialog shell for create/edit forms: header, scrollable body, footer. */
export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  formId,
  submitText,
  isPending,
  children,
}: FormDialogProps) {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onOpenChange={(v) => !isPending && onOpenChange(v)}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader className='text-start'>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className='max-h-[65vh] overflow-y-auto px-1 py-1'>{children}</div>
        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button type='submit' form={formId} disabled={isPending}>
            {isPending && <Loader2 className='animate-spin' />}
            {submitText ?? t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
