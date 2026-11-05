import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { useCountUp } from './use-count-up'

// With reduced motion the hook must not animate at all
vi.mock('motion/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('motion/react')>()),
  useReducedMotion: () => true,
}))

function Probe({ active }: { active: boolean }) {
  return <span data-testid='value'>{useCountUp(1234, active)}</span>
}

describe('useCountUp', () => {
  it('returns the final value at once with reduced motion', async () => {
    const { getByTestId } = await render(<Probe active={false} />)
    await expect.element(getByTestId('value')).toHaveTextContent('1234')
  })
})
