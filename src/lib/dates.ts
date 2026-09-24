import type { ISODate } from '../types'

/** Fecha de hoy como 'AAAA-MM-DD' (hora local). */
export function today(): ISODate {
  const d = new Date()
  return toISO(d)
}

function toISO(d: Date): ISODate {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function addMonths(date: ISODate, months: number): ISODate {
  const d = new Date(`${date}T00:00:00`)
  d.setMonth(d.getMonth() + months)
  return toISO(d)
}

/** '2026-03-12' → '12 mar 2026'. Devuelve '' si no hay fecha. */
export function formatDate(date: ISODate | ''): string {
  if (!date) return ''
  return new Date(`${date}T00:00:00`).toLocaleDateString('es', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function isExpired(expiresAt: ISODate, reference: ISODate = today()): boolean {
  return expiresAt < reference
}

/** Días que faltan hasta una fecha (negativo si ya pasó). */
export function daysUntil(date: ISODate, reference: ISODate = today()): number {
  const ms = new Date(`${date}T00:00:00`).getTime() - new Date(`${reference}T00:00:00`).getTime()
  return Math.round(ms / 86_400_000)
}
