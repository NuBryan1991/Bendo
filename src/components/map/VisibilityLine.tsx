import type { CSSProperties } from 'react'

/**
 * Línea de visibilidad: separa lo que el cliente ve (frontstage) de lo que no ve (backstage).
 * Ocupa toda la fila de la grilla; el texto queda fijo a la izquierda al hacer scroll horizontal.
 */
export function VisibilityLine({ style }: { style: CSSProperties }) {
  return (
    <div style={style} role="separator" aria-label="Línea de visibilidad" className="relative h-12 bg-canvas">
      <div className="absolute inset-x-0 top-1/2 border-t-[3px] border-dashed border-ink" />
      <div className="sticky left-0 flex h-full w-max items-center gap-3 px-3">
        <span className="relative rounded bg-ink px-2 py-1 text-xs font-bold tracking-wider text-white uppercase">
          Línea de visibilidad
        </span>
        <span className="relative rounded bg-canvas px-1.5 text-xs text-ink-muted">
          ↑ Lo que el cliente ve · ↓ Lo que el cliente no ve
        </span>
      </div>
    </div>
  )
}
