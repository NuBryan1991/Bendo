import { describe, expect, it } from 'vitest'
import { addMonths, daysUntil, isExpired } from './dates'

describe('fechas', () => {
  it('suma meses (caducidad a 12 meses)', () => {
    expect(addMonths('2025-10-01', 12)).toBe('2026-10-01')
  })
  it('detecta personas vencidas', () => {
    expect(isExpired('2026-01-01', '2026-09-24')).toBe(true)
    expect(isExpired('2026-10-01', '2026-09-24')).toBe(false)
  })
  it('cuenta días hasta una fecha', () => {
    expect(daysUntil('2026-10-01', '2026-09-24')).toBe(7)
    expect(daysUntil('2026-09-20', '2026-09-24')).toBe(-4)
  })
})
