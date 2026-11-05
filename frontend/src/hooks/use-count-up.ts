import { useEffect, useState } from 'react'
import { animate, useReducedMotion } from 'motion/react'

/**
 * Number that counts from 0 to `target` once `active` turns true (e.g. when
 * the block scrolls into view). With reduced motion it is the target at once.
 */
export function useCountUp(target: number, active: boolean, duration = 1.6) {
  const reduced = useReducedMotion()
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!active || reduced) return
    const controls = animate(0, target, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => setValue(Math.round(v)),
    })
    return () => controls.stop()
  }, [active, reduced, target, duration])

  return reduced ? target : value
}
