import { Link, useNavigate } from 'react-router-dom'
import { useStudioStore } from '../../store/useStudioStore'
import type { Project } from '../../types'
import { BasisBadge } from '../ui/Badges'
import { Button, IconButton } from '../ui/Button'
import { Portrait, ValidityLabel } from './PersonaParts'

/** Pestaña Personas del proyecto: lista, crear, duplicar y eliminar. */
export function PersonasTab({ project }: { project: Project }) {
  const addPersona = useStudioStore((s) => s.addPersona)
  const duplicatePersona = useStudioStore((s) => s.duplicatePersona)
  const deletePersona = useStudioStore((s) => s.deletePersona)
  const navigate = useNavigate()

  return (
    <section aria-label="Personas">
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-sm text-ink-muted">
          Las personas vencen a los 12 meses: la investigación envejece. Renuévalas cuando las vuelvas a validar.
        </p>
        <Button
          variant="primary"
          icon="plus"
          onClick={() => {
            const id = addPersona(project.id)
            if (id) navigate(`/proyecto/${project.id}/persona/${id}`)
          }}
        >
          Nueva persona
        </Button>
      </div>

      {project.personas.length === 0 ? (
        <p className="rounded-panel border border-dashed border-line-strong bg-surface p-10 text-center text-ink-muted">
          Aún no hay personas. Crea una para usarla como actor principal de tus mapas.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {project.personas.map((p) => {
            const usedIn = project.maps.filter((m) => m.personaId === p.id).length
            return (
              <li
                key={p.id}
                className={`flex gap-4 rounded-panel border-2 bg-surface p-5 ${
                  p.basis === 'investigación' ? 'border-solid border-research' : 'border-dashed border-assumption'
                }`}
              >
                <Portrait persona={p} size={64} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      to={`/proyecto/${project.id}/persona/${p.id}`}
                      className="font-semibold [overflow-wrap:anywhere] text-ink hover:text-primary hover:underline"
                    >
                      {p.name || 'Sin nombre'}
                    </Link>
                    <div className="flex shrink-0 gap-1">
                      <IconButton icon="copy" label={`Duplicar ${p.name}`} onClick={() => duplicatePersona(project.id, p.id)} />
                      <IconButton
                        icon="trash"
                        label={`Eliminar ${p.name}`}
                        onClick={() => {
                          const extra = usedIn ? ` ${usedIn} mapa(s) quedarán sin actor principal.` : ''
                          if (confirm(`¿Eliminar la persona "${p.name}"?${extra}`)) deletePersona(project.id, p.id)
                        }}
                      />
                    </div>
                  </div>
                  {p.demographics && <p className="mt-0.5 text-sm text-ink-muted">{p.demographics}</p>}
                  {p.quote && <p className="mt-2 line-clamp-2 text-sm italic">“{p.quote}”</p>}
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    <BasisBadge basis={p.basis} />
                    <ValidityLabel persona={p} />
                    <span className="text-ink-muted">
                      · {usedIn} {usedIn === 1 ? 'mapa' : 'mapas'}
                    </span>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
