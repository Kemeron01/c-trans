import { describe, expect, it } from 'vitest'
import { parseDate } from './format'

describe('parseDate', () => {
  it('reads a calendar date as local midnight, not UTC', () => {
    const d = parseDate('2026-10-22')
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([
      2026, 9, 22, 0,
    ])
  })
})
