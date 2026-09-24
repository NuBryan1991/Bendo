import type { Basis } from '../../types'
import type { Solidity } from '../../lib/map'

export function BasisBadge({ basis }: { basis: Basis }) {
  return basis === 'investigación' ? (
    <span className="inline-flex items-center rounded border border-research bg-research-soft px-1.5 py-0.5 text-[11px] font-semibold text-research-ink">
      Investigación
    </span>
  ) : (
    <span className="inline-flex items-center rounded border border-dashed border-assumption bg-assumption-soft px-1.5 py-0.5 text-[11px] font-semibold text-assumption-ink">
      Supuesto
    </span>
  )
}

export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded bg-surface-muted px-1.5 py-0.5 text-[11px] font-medium text-ink-muted">
      {children}
    </span>
  )
}

/** Barra de solidez: porcentaje de tarjetas basadas en investigación. */
export function SolidityMeter({ value, compact = false }: { value: Solidity; compact?: boolean }) {
  const pct = value.percent ?? 0
  const text =
    value.percent === null
      ? 'Sin tarjetas'
      : `${value.percent} % investigación (${value.research} de ${value.total})`
  return (
    <div className="flex items-center gap-2" title="Porcentaje de tarjetas basadas en investigación">
      {!compact && <span className="text-xs font-semibold text-ink-muted">Solidez</span>}
      <div
        role="meter"
        aria-label="Solidez del mapa"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-valuetext={text}
        className="h-2 w-24 overflow-hidden rounded-full border border-assumption bg-assumption-soft"
      >
        <div className="h-full bg-research" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-ink tabular-nums">{text}</span>
    </div>
  )
}
