import type { Persona } from '../../types'
import { BasisBadge } from '../ui/Badges'
import { Portrait, ValidityLabel } from './PersonaParts'

/** Ficha de la persona tal como se lee en un workshop. Borde punteado si es un supuesto. */
export function PersonaSheet({ persona }: { persona: Persona }) {
  const lists = [
    { title: 'Necesidades', items: persona.needs },
    { title: 'Motivaciones', items: persona.motivations },
    { title: 'Frustraciones', items: persona.frustrations },
  ]
  const stats = persona.stats.filter((s) => s.label || s.value)

  return (
    <article
      aria-label={`Ficha de ${persona.name}`}
      className={`flex flex-col gap-4 rounded-panel border-2 bg-surface p-5 ${
        persona.basis === 'investigación' ? 'border-solid border-research' : 'border-dashed border-assumption'
      }`}
    >
      <header className="flex items-start gap-4">
        <Portrait persona={persona} size={88} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold [overflow-wrap:anywhere]">{persona.name || 'Sin nombre'}</h2>
            <BasisBadge basis={persona.basis} />
          </div>
          {persona.demographics && <p className="mt-0.5 text-sm text-ink-muted">{persona.demographics}</p>}
          <p className="mt-1 text-xs">
            <ValidityLabel persona={persona} />
          </p>
        </div>
      </header>

      {persona.quote && (
        <blockquote className="border-l-4 border-line-strong pl-3 text-base italic">“{persona.quote}”</blockquote>
      )}
      {persona.description && <p className="text-sm leading-relaxed">{persona.description}</p>}

      <div className="grid gap-3 sm:grid-cols-3">
        {lists.map(({ title, items }) => (
          <section key={title} className="rounded-md bg-canvas p-3">
            <h3 className="text-xs font-bold tracking-wide text-ink-muted uppercase">{title}</h3>
            {items.filter(Boolean).length ? (
              <ul className="mt-1.5 list-disc pl-4 text-sm leading-snug">
                {items.filter(Boolean).map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-1.5 text-sm text-ink-muted italic">Sin completar.</p>
            )}
          </section>
        ))}
      </div>

      {stats.length > 0 && (
        <dl className="flex flex-wrap gap-3">
          {stats.map((s, i) => (
            <div key={i} className="rounded-md border border-line px-3 py-2">
              <dt className="text-xs text-ink-muted">{s.label}</dt>
              <dd className="text-lg font-semibold tabular-nums">{s.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {persona.contextImages.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {persona.contextImages.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`Imagen de contexto ${i + 1} de ${persona.name}`}
              className="aspect-[4/3] w-full rounded-md border border-line object-cover"
            />
          ))}
        </div>
      )}
    </article>
  )
}
