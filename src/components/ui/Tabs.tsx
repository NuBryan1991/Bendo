import { useRef, type KeyboardEvent } from 'react'

/** Pestañas accesibles (patrón WAI-ARIA): flechas izquierda/derecha para moverse. */
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
}: {
  tabs: { value: T; label: string; count?: number }[]
  value: T
  onChange: (value: T) => void
  label: string
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  const onKeyDown = (e: KeyboardEvent, index: number) => {
    const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!delta) return
    const next = (index + delta + tabs.length) % tabs.length
    onChange(tabs[next].value)
    refs.current[next]?.focus()
  }

  return (
    <div role="tablist" aria-label={label} className="flex gap-1 border-b border-line">
      {tabs.map((t, i) => {
        const selected = t.value === value
        return (
          <button
            key={t.value}
            ref={(el) => {
              refs.current[i] = el
            }}
            role="tab"
            id={`tab-${t.value}`}
            aria-selected={selected}
            aria-controls={`panel-${t.value}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(t.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium ${
              selected ? 'border-primary text-primary' : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            {t.label}
            {t.count !== undefined && (
              <span className="ml-2 rounded-full bg-surface-muted px-2 py-0.5 text-xs text-ink-muted">{t.count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
