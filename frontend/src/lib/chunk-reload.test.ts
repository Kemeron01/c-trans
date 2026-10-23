import { describe, expect, it } from 'vitest'
import { isChunkLoadError } from './chunk-reload'

describe('isChunkLoadError', () => {
  it('recognises failed lazy imports in Chrome, Firefox and Safari', () => {
    for (const message of [
      'Failed to fetch dynamically imported module: http://x/assets/a.js',
      'error loading dynamically imported module',
      'Importing a module script failed.',
    ]) {
      expect(isChunkLoadError(new TypeError(message))).toBe(true)
    }
  })

  it('ignores ordinary errors', () => {
    expect(
      isChunkLoadError(new Error('Cannot read properties of undefined'))
    ).toBe(false)
  })
})
