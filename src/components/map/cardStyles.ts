import type { Card } from '../../types'

/** Clases visuales según la evidencia: punteado = supuesto, sólido = investigación. */
export function cardSurface(card: Pick<Card, 'basis'>): string {
  return card.basis === 'investigación'
    ? 'border-2 border-solid border-research bg-surface'
    : 'border-2 border-dashed border-assumption bg-assumption-soft'
}
