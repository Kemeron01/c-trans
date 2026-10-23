import { Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

/** 1–5 stars; interactive when `onChange` is given. */
export function RatingStars({
  value,
  onChange,
  size = 'size-4',
}: {
  value: number
  onChange?: (value: number) => void
  size?: string
}) {
  const { t } = useTranslation()
  return (
    <div
      className='flex gap-0.5'
      role={onChange ? 'radiogroup' : 'img'}
      aria-label={t('reviews.rating', { value })}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const star = (
          <Star
            className={cn(
              size,
              n <= value
                ? 'fill-amber-400 text-amber-400'
                : 'text-muted-foreground/40'
            )}
          />
        )
        return onChange ? (
          <button
            key={n}
            type='button'
            role='radio'
            aria-checked={n === value}
            aria-label={String(n)}
            onClick={() => onChange(n)}
            className='rounded-sm p-0.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'
          >
            {star}
          </button>
        ) : (
          <span key={n}>{star}</span>
        )
      })}
    </div>
  )
}
