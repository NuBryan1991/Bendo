import type { ReactNode } from 'react'
import { PRINCIPLES } from '../../data/defaults'
import { formatDate, isExpired, today } from '../../lib/dates'
import { solidity } from '../../lib/map'
import type { JourneyMap, MapView, Project } from '../../types'
import { EditorContext } from '../map/EditorContext'
import { Legend } from '../map/MapHeader'
import { MapGrid } from '../map/MapGrid'

interface ExportSheetProps {
  project: Project
  map: JourneyMap
  view: MapView
  withHeader: boolean
  stepWidth: number
}

const noop = () => {}

/**
 * Lámina imprimible del mapa: ficha arriba, grilla completa (sin botones) y pie.
 * Se dibuja fuera de la pantalla y se convierte en imagen (ver lib/exportMap).
 */
export function ExportSheet({ project, map, view, withHeader, stepWidth }: ExportSheetProps) {
  const persona = project.personas.find((p) => p.id === map.personaId)
  const solid = solidity(map, view)
  const rs = map.researchStatement
  const principlesDone = PRINCIPLES.filter((p) => map.principles.find((c) => c.id === p.id)?.checked)
  const dates = [formatDate(rs.dateFrom), formatDate(rs.dateTo)].filter(Boolean).join(' – ')
  const research = [
    rs.methods,
    rs.interviewCount !== null ? `${rs.interviewCount} entrevistas` : '',
    dates,
    rs.places,
  ].filter(Boolean)

  return (
    <div className="inline-grid bg-surface p-10 font-sans text-ink" data-export-sheet>
      {withHeader && (
        // width 0 + min-width 100%: la ficha toma el ancho de la grilla sin ensancharla.
        <header style={{ width: 0, minWidth: '100%' }} className="mb-6 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-8">
            <div className="min-w-0">
              <p className="text-sm font-semibold tracking-wide text-ink-muted uppercase">{project.name}</p>
              <h1 className="mt-1 text-4xl leading-tight font-bold">{map.title || 'Mapa sin título'}</h1>
              <p className="mt-2 text-base text-ink-muted">
                {map.state === 'actual' ? 'Estado actual' : 'Estado futuro'} · Zoom {map.zoom} ·{' '}
                {view === 'journey' ? 'Vista Journey (frontstage)' : 'Vista Blueprint (frontstage + backstage)'} ·
                Actor: {persona?.name ?? 'sin persona'}
              </p>
            </div>
            <div className="shrink-0 rounded-panel border-2 border-research bg-research-soft px-5 py-3 text-right">
              <p className="text-sm font-semibold text-research-ink">Solidez</p>
              <p className="text-4xl font-bold text-research-ink tabular-nums">
                {solid.percent === null ? '—' : `${solid.percent} %`}
              </p>
              <p className="text-sm text-research-ink">
                {solid.research} de {solid.total} tarjetas basadas en investigación
              </p>
            </div>
          </div>

          {persona && isExpired(persona.expiresAt) && (
            <p className="rounded-md border-2 border-critical bg-critical-soft px-4 py-2 text-base font-semibold text-critical">
              Atención: la persona “{persona.name}” venció el {formatDate(persona.expiresAt)}.
            </p>
          )}

          <div className="grid grid-cols-3 gap-4">
            <InfoBlock title="Pregunta de diseño">{map.designQuestion}</InfoBlock>
            <InfoBlock title="Escenario">{map.scenario}</InfoBlock>
            <InfoBlock title="Declaración de investigación" warn={research.length === 0}>
              {research.length ? research.join(' · ') : 'Sin declaración de investigación.'}
              {rs.triangulationNotes && (
                <span className="mt-1 block text-ink-muted">Triangulación: {rs.triangulationNotes}</span>
              )}
            </InfoBlock>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-line">
            <Legend bordered={false} />
            <p className="px-5 py-2 text-xs text-ink-muted">
              Principios cumplidos ({principlesDone.length} de {PRINCIPLES.length}):{' '}
              {principlesDone.length ? principlesDone.map((p) => p.name).join(', ') : 'ninguno marcado'}
            </p>
          </div>
        </header>
      )}

      <EditorContext.Provider
        value={{ project, map, view, editingCardId: null, setEditingCardId: noop, exporting: true, stepWidth }}
      >
        <MapGrid />
      </EditorContext.Provider>

      <footer style={{ width: 0, minWidth: '100%' }} className="mt-4 flex justify-between text-xs text-ink-muted">
        <span>
          {project.name} · {map.title}
        </span>
        <span>Journey Map Studio · Exportado el {formatDate(today())}</span>
      </footer>
    </div>
  )
}

function InfoBlock({ title, children, warn }: { title: string; children: ReactNode; warn?: boolean }) {
  return (
    <section
      className={`rounded-md border p-3 ${warn ? 'border-dashed border-assumption bg-assumption-soft' : 'border-line bg-canvas'}`}
    >
      <h2 className="text-xs font-bold tracking-wide text-ink-muted uppercase">{title}</h2>
      <p className="mt-1 text-sm leading-snug">{children || <span className="text-ink-muted italic">Sin completar.</span>}</p>
    </section>
  )
}
