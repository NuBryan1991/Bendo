import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { formatDate, isExpired } from '../../lib/dates'
import { solidity } from '../../lib/map'
import { SolidityMeter, Tag } from '../ui/Badges'
import { Icon } from '../ui/Icon'
import { useEditor } from './EditorContext'

export function MapHeader({ actions }: { actions?: ReactNode }) {
  const { project, map, view } = useEditor()
  const persona = project.personas.find((p) => p.id === map.personaId)
  const expired = persona ? isExpired(persona.expiresAt) : false

  return (
    <header className="border-b border-line bg-surface">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3">
        <div className="min-w-0 flex-1">
          <nav aria-label="Ruta" className="flex items-center gap-1 text-sm text-ink-muted">
            <Link to="/" className="hover:text-ink hover:underline">
              Proyectos
            </Link>
            <Icon name="chevronRight" size={12} />
            <Link to={`/proyecto/${project.id}`} className="truncate hover:text-ink hover:underline">
              {project.name}
            </Link>
          </nav>
          <h1 className="truncate text-lg font-semibold">{map.title || 'Mapa sin título'}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Tag>{map.state === 'actual' ? 'Estado actual' : 'Estado futuro'}</Tag>
            <Tag>Zoom: {map.zoom}</Tag>
            <Tag>Actor: {persona?.name ?? 'sin persona'}</Tag>
          </div>
        </div>
        <SolidityMeter value={solidity(map, view)} />
        {actions}
      </div>

      {persona && expired && (
        <div role="alert" className="flex items-center gap-2 border-t border-critical bg-critical-soft px-5 py-2 text-sm text-critical">
          <Icon name="alert" />
          <span>
            <strong>La persona “{persona.name}” venció el {formatDate(persona.expiresAt)}.</strong> Revísala con
            investigación reciente antes de tomar decisiones con este mapa.
          </span>
        </div>
      )}

      <Legend />
    </header>
  )
}

export function Legend({ bordered = true }: { bordered?: boolean }) {
  return (
    <div
      className={`flex flex-wrap items-center gap-x-5 gap-y-1 px-5 py-2 text-xs text-ink-muted ${bordered ? 'border-t border-line' : ''}`}
    >
      <span className="font-semibold">Leyenda:</span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-3.5 w-5 rounded-sm border-2 border-solid border-research bg-surface" /> Investigación
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-3.5 w-5 rounded-sm border-2 border-dashed border-assumption bg-assumption-soft" /> Supuesto
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-3.5 w-5 rounded-sm border-t-4 border-moment bg-moment-soft" /> Momento de la verdad
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-full bg-critical" /> Emoción −2 (punto crítico)
      </span>
    </div>
  )
}
