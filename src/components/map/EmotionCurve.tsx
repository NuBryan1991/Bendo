import type { GridColumn } from '../../lib/map'
import { EMOTION_CURVE_HEIGHT } from '../../styles/layout'

const PAD = 18
const LABELS: Record<number, string> = { 2: 'muy positiva', 1: 'positiva', 0: 'neutral', [-1]: 'negativa', [-2]: 'muy negativa' }

/** y en píxeles para una emoción de -2 a +2. */
const yFor = (emotion: number) => PAD + ((2 - emotion) * (EMOTION_CURVE_HEIGHT - PAD * 2)) / 4

/**
 * Curva emocional alineada con las columnas de pasos.
 * Los puntos -2 se dibujan en rojo y más grandes; los momentos de la verdad llevan anillo morado.
 */
export function EmotionCurve({ columns, stepWidth }: { columns: GridColumn[]; stepWidth: number }) {
  const width = columns.length * stepWidth
  const points = columns.flatMap((col, i) =>
    col.kind === 'step' ? [{ x: i * stepWidth + stepWidth / 2, y: yFor(col.step.emotion), step: col.step }] : [],
  )

  // Curva suave: cada tramo es una Bézier con puntos de control a mitad de camino en x.
  const path = points
    .map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`
      const prev = points[i - 1]
      const mx = (prev.x + p.x) / 2
      return `C ${mx} ${prev.y}, ${mx} ${p.y}, ${p.x} ${p.y}`
    })
    .join(' ')

  const summary = points.map((p) => `${p.step.title}: ${LABELS[p.step.emotion]}`).join('; ')

  return (
    <svg
      width={width}
      height={EMOTION_CURVE_HEIGHT}
      role="img"
      aria-label={`Curva emocional. ${summary}`}
      className="block"
    >
      {/* Líneas guía: +2, 0, -2 */}
      {[2, 0, -2].map((e) => (
        <line
          key={e}
          x1={0}
          x2={width}
          y1={yFor(e)}
          y2={yFor(e)}
          stroke="var(--color-line)"
          strokeDasharray={e === 0 ? '4 4' : undefined}
        />
      ))}
      {/* Zona crítica */}
      <rect x={0} y={yFor(-1.5)} width={width} height={EMOTION_CURVE_HEIGHT - yFor(-1.5)} fill="var(--color-critical-soft)" opacity={0.6} />
      <path d={path} fill="none" stroke="var(--color-ink)" strokeWidth={2.5} strokeLinecap="round" />
      {points.map(({ x, y, step }) => {
        const critical = step.emotion === -2
        return (
          <g key={step.id}>
            <title>{`${step.title}: emoción ${step.emotion > 0 ? '+' : ''}${step.emotion}${step.momentOfTruth ? ' · momento de la verdad' : ''}`}</title>
            {step.momentOfTruth && <circle cx={x} cy={y} r={13} fill="none" stroke="var(--color-moment)" strokeWidth={3} />}
            <circle
              cx={x}
              cy={y}
              r={critical ? 8 : 6}
              fill={critical ? 'var(--color-critical)' : 'var(--color-surface)'}
              stroke={critical ? 'var(--color-critical)' : 'var(--color-ink)'}
              strokeWidth={2.5}
            />
          </g>
        )
      })}
    </svg>
  )
}

/** Escala que se muestra en la columna de etiquetas, alineada con las líneas guía. */
export function EmotionScale() {
  return (
    <div className="absolute inset-0 text-[11px] text-ink-muted" aria-hidden="true">
      {[
        { e: 2, label: '+2' },
        { e: 0, label: '0' },
        { e: -2, label: '−2' },
      ].map(({ e, label }) => (
        <span key={e} className="absolute right-2 -translate-y-1/2 tabular-nums" style={{ top: yFor(e) }}>
          {label}
        </span>
      ))}
    </div>
  )
}
