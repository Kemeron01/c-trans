import { type SVGProps } from 'react'
import { cn } from '@/lib/utils'

// Placeholder mark (truck) until the final C-Trans logo is provided.
// Keep in sync with public/images/favicon.svg.
export function Logo({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
      height='24'
      width='24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      className={cn('size-6', className)}
      {...props}
    >
      <title>C-Trans</title>
      <path d='M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2' />
      <path d='M15 18H9' />
      <path d='M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14' />
      <circle cx='17' cy='18' r='2' />
      <circle cx='7' cy='18' r='2' />
    </svg>
  )
}
