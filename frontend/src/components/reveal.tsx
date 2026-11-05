import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'
import { TextAnimate } from '@/components/ui/text-animate'

/**
 * Soft appearance on scroll (once). `delay` (seconds) staggers siblings:
 * pass `index * 0.08`. Nothing moves with prefers-reduced-motion.
 */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const reduced = useReducedMotion()
  if (reduced) return <div className={className}>{children}</div>
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -60px 0px' }}
      transition={{ duration: 0.5, ease: 'easeOut', delay }}
    >
      {children}
    </motion.div>
  )
}

/** Section title / subtitle: words blur in once when scrolled to. */
export function AnimatedText({
  children,
  as = 'h2',
  className,
  delay,
}: {
  children: string
  as?: 'h1' | 'h2' | 'p'
  className?: string
  delay?: number
}) {
  const reduced = useReducedMotion()
  const Tag = as
  if (reduced) return <Tag className={className}>{children}</Tag>
  return (
    <TextAnimate
      as={as}
      by='word'
      animation='blurInUp'
      startOnView
      once
      delay={delay}
      className={cn(className)}
    >
      {children}
    </TextAnimate>
  )
}
