import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { CreditCard, Plus, Star, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { cardsQuery, clientApi, profileQuery } from '@/api/account'
import { authKeys } from '@/api/auth'
import { type ClientProfile, type PaymentCard } from '@/api/types'
import { applyServerErrors } from '@/lib/form-errors'
import { emptyToNull } from '@/lib/format'
import { optionalEmail, requiredString } from '@/lib/validation'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Form } from '@/components/ui/form'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { FormDialog } from '@/components/form-dialog'
import { TextField } from '@/components/form-fields'

const route = getRouteApi('/_site/_client/account')

export function Account() {
  const { t } = useTranslation()
  const { welcome } = route.useSearch()
  const profile = useQuery(profileQuery())

  return (
    <div className='grid gap-6'>
      <div>
        <h1 className='text-2xl font-bold tracking-tight'>
          {t('site.account')}
        </h1>
        {profile.data && (
          <p className='text-muted-foreground'>
            {t('account.code')}:{' '}
            <span className='font-mono font-medium text-foreground'>
              {profile.data.client_code}
            </span>
            {' · '}
            {profile.data.phone}
          </p>
        )}
      </div>
      {welcome && (
        <Alert>
          <AlertDescription>{t('account.welcome')}</AlertDescription>
        </Alert>
      )}
      <div className='grid items-start gap-6 lg:grid-cols-2'>
        {profile.data ? (
          <ProfileCard profile={profile.data} />
        ) : (
          <Skeleton className='h-80' />
        )}
        <CardsCard />
      </div>
    </div>
  )
}

const profileSchema = z.object({
  full_name: requiredString(),
  email: optionalEmail(),
  address: z.string().trim(),
})
type ProfileValues = z.infer<typeof profileSchema>

function ProfileCard({ profile }: { profile: ClientProfile }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile.full_name,
      email: profile.email ?? '',
      address: profile.address,
    },
  })
  const save = useMutation({
    mutationFn: (v: ProfileValues) =>
      clientApi.updateProfile({ ...v, email: emptyToNull(v.email) }),
    onSuccess: (p) => {
      queryClient.setQueryData(profileQuery().queryKey, p)
      queryClient.invalidateQueries({ queryKey: authKeys.me })
      form.reset({
        full_name: p.full_name,
        email: p.email ?? '',
        address: p.address,
      })
      toast.success(t('common.saved'))
    },
    onError: (error) => applyServerErrors(error, form),
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('account.profile')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            className='grid gap-4'
            onSubmit={form.handleSubmit((v) => save.mutate(v))}
          >
            <TextField
              control={form.control}
              name='full_name'
              label={t('staff.fullName')}
              autoComplete='name'
            />
            <TextField
              control={form.control}
              name='email'
              label={t('staff.email')}
              type='email'
              autoComplete='email'
            />
            <TextField
              control={form.control}
              name='address'
              label={t('account.address')}
              description={t('account.addressHint')}
              autoComplete='street-address'
            />
            <Button
              className='justify-self-start'
              disabled={save.isPending || !form.formState.isDirty}
            >
              {t('common.save')}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

function CardsCard() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { data: cards } = useQuery(cardsQuery())
  const [adding, setAdding] = useState(false)
  const [verifying, setVerifying] = useState<PaymentCard | null>(null)
  const [removing, setRemoving] = useState<PaymentCard | null>(null)
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: cardsQuery().queryKey })

  const setDefault = useMutation({
    mutationFn: (id: number) => clientApi.setDefaultCard(id),
    onSuccess: refresh,
  })
  const remove = useMutation({
    mutationFn: (id: number) => clientApi.removeCard(id),
    onSuccess: () => {
      refresh()
      setRemoving(null)
      toast.success(t('common.deleted'))
    },
  })

  return (
    <Card id='cards'>
      <CardHeader className='flex flex-row items-start justify-between gap-2'>
        <div className='grid gap-1.5'>
          <CardTitle>{t('account.cards')}</CardTitle>
          <CardDescription>{t('account.cardsHint')}</CardDescription>
        </div>
        <Button size='sm' variant='outline' onClick={() => setAdding(true)}>
          <Plus /> {t('account.addCard')}
        </Button>
      </CardHeader>
      <CardContent className='grid gap-2'>
        {cards?.map((card) => (
          <div
            key={card.id}
            className='flex flex-wrap items-center gap-3 rounded-md border p-3'
          >
            <CreditCard className='size-5 text-muted-foreground' />
            <div className='grid'>
              <span className='font-mono'>{card.mask}</span>
              <span className='text-xs text-muted-foreground'>
                {card.expiry}
              </span>
            </div>
            <div className='ms-auto flex items-center gap-1'>
              {card.is_default && (
                <Badge variant='secondary'>{t('account.default')}</Badge>
              )}
              {!card.verified && (
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => setVerifying(card)}
                >
                  {t('account.confirm')}
                </Button>
              )}
              {card.verified && !card.is_default && (
                <Button
                  size='icon'
                  variant='ghost'
                  aria-label={t('account.makeDefault')}
                  title={t('account.makeDefault')}
                  onClick={() => setDefault.mutate(card.id)}
                >
                  <Star />
                </Button>
              )}
              <Button
                size='icon'
                variant='ghost'
                aria-label={t('common.delete')}
                onClick={() => setRemoving(card)}
              >
                <Trash2 />
              </Button>
            </div>
          </div>
        ))}
        {cards && !cards.length && (
          <p className='text-sm text-muted-foreground'>
            {t('account.noCards')}
          </p>
        )}
      </CardContent>

      {adding && (
        <AddCardDialog
          onClose={() => setAdding(false)}
          onAdded={(card) => {
            setAdding(false)
            refresh()
            setVerifying(card)
          }}
        />
      )}
      {verifying && (
        <VerifyCardDialog card={verifying} onClose={() => setVerifying(null)} />
      )}
      {removing && (
        <ConfirmDialog
          open
          onOpenChange={() => setRemoving(null)}
          title={t('account.removeCard')}
          desc={removing.mask}
          confirmText={t('common.delete')}
          destructive
          isLoading={remove.isPending}
          handleConfirm={() => remove.mutate(removing.id)}
        />
      )}
    </Card>
  )
}

const cardSchema = z.object({
  number: z
    .string()
    .refine(
      (v) => v.replace(/\D/g, '').length === 16,
      'account.cardNumberInvalid'
    ),
  expiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'account.expiryInvalid'),
})
type CardValues = z.infer<typeof cardSchema>

/** Sandbox stand-in for the provider's card form (Payme / Click). */
function AddCardDialog({
  onClose,
  onAdded,
}: {
  onClose: () => void
  onAdded: (card: PaymentCard) => void
}) {
  const { t } = useTranslation()
  const form = useForm<CardValues>({
    resolver: zodResolver(cardSchema),
    defaultValues: { number: '', expiry: '' },
  })
  const add = useMutation({
    mutationFn: (v: CardValues) =>
      clientApi.addCard(v.number.replace(/\D/g, ''), v.expiry),
    onSuccess: onAdded,
    onError: (error) => applyServerErrors(error, form),
  })
  return (
    <FormDialog
      open
      onOpenChange={onClose}
      title={t('account.addCard')}
      description={t('account.addCardHint')}
      formId='card-form'
      submitText={t('common.continue')}
      isPending={add.isPending}
    >
      <Form {...form}>
        <form
          id='card-form'
          className='grid gap-4 sm:grid-cols-[1fr_8rem]'
          onSubmit={form.handleSubmit((v) => add.mutate(v))}
        >
          <TextField
            control={form.control}
            name='number'
            label={t('account.cardNumber')}
            inputMode='numeric'
            autoComplete='cc-number'
            placeholder='8600 0000 0000 0000'
          />
          <TextField
            control={form.control}
            name='expiry'
            label={t('account.expiry')}
            inputMode='numeric'
            autoComplete='cc-exp'
            placeholder='MM/YY'
            maxLength={5}
          />
        </form>
      </Form>
    </FormDialog>
  )
}

function VerifyCardDialog({
  card,
  onClose,
}: {
  card: PaymentCard
  onClose: () => void
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const verify = useMutation({
    mutationFn: () => clientApi.verifyCard(card.id, code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cardsQuery().queryKey })
      toast.success(t('account.cardConfirmed'))
      onClose()
    },
    onError: () => {
      setCode('')
      setError(t('account.wrongCode'))
    },
  })
  return (
    <FormDialog
      open
      onOpenChange={onClose}
      title={t('account.confirmCard')}
      description={t('account.confirmCardHint', { card: card.mask })}
      formId='verify-card-form'
      submitText={t('account.confirm')}
      isPending={verify.isPending}
      submitDisabled={code.length !== 6}
    >
      <form
        id='verify-card-form'
        className='grid gap-2'
        onSubmit={(e) => {
          e.preventDefault()
          verify.mutate()
        }}
      >
        <InputOTP maxLength={6} value={code} onChange={setCode} autoFocus>
          <InputOTPGroup>
            {Array.from({ length: 6 }, (_, i) => (
              <InputOTPSlot key={i} index={i} />
            ))}
          </InputOTPGroup>
        </InputOTP>
        {error && (
          <p role='alert' className='text-sm text-destructive'>
            {error}
          </p>
        )}
      </form>
    </FormDialog>
  )
}
