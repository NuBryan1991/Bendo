import { useId, useRef, useState, type RefObject } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { EditorContext } from '../components/map/EditorContext'
import { MapGrid } from '../components/map/MapGrid'
import { BasisBadge, SolidityMeter } from '../components/ui/Badges'
import { Button } from '../components/ui/Button'
import { Segmented } from '../components/ui/Field'
import { Icon } from '../components/ui/Icon'
import { futureMapFor, opportunityCards, orderedSteps, solidity } from '../lib/map'
import { scrollBehavior } from '../lib/motion'
import { usePageTitle } from '../lib/usePageTitle'
import { useProject } from '../lib/useProject'
import { useStudioStore } from '../store/useStudioStore'
import type { JourneyMap, MapView, Project } from '../types'
import NotFound from './NotFound'

/** Comparador: mapa actual y mapa futuro lado a lado, con las oportunidades conectadas en el centro. */
export default function ComparePage() {
  const { projectId } = useParams()
  const project = useProject(projectId)
  const [params, setParams] = useSearchParams()
  const [view, setView] = useState<MapView>('journey')
  const createFutureMap = useStudioStore((s) => s.createFutureMap)
  const navigate = useNavigate()
  const leftRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)
  usePageTitle('Comparador')

  if (!project) return <NotFound message="Este proyecto no existe." />

  const actualMaps = project.maps.filter((m) => m.state === 'actual')
  const futureMaps = project.maps.filter((m) => m.state === 'futuro')
  const actual = actualMaps.find((m) => m.id === params.get('actual')) ?? actualMaps[0]
  const future =
    futureMaps.find((m) => m.id === params.get('futuro')) ??
    (actual ? futureMapFor(project, actual.id) : undefined) ??
    futureMaps[0]

  const choose = (key: 'actual' | 'futuro', id: string) => {
    const next = { actual: actual?.id ?? '', futuro: future?.id ?? '', [key]: id }
    // Al cambiar el mapa actual, se sugiere su propio mapa futuro.
    if (key === 'actual') next.futuro = futureMapFor(project, id)?.id ?? next.futuro
    setParams(next, { replace: true })
  }

  /** Lleva la vista a la oportunidad (izquierda) y al paso futuro (derecha) y los resalta. */
  const show = (cardId: string, stepId?: string) => {
    flash(leftRef, `[data-card-id="${cardId}"]`)
    if (stepId) flash(rightRef, `[data-step-id="${stepId}"]`)
  }

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-line bg-surface px-5 py-3">
        <nav aria-label="Ruta" className="flex items-center gap-1 text-sm text-ink-muted">
          <Link to="/" className="hover:text-ink hover:underline">
            Proyectos
          </Link>
          <Icon name="chevronRight" size={12} />
          <Link to={`/proyecto/${project.id}`} className="hover:text-ink hover:underline">
            {project.name}
          </Link>
        </nav>
        <div className="mt-1 flex flex-wrap items-end gap-x-6 gap-y-3">
          <h1 className="text-lg font-semibold">Comparador: estado actual y futuro</h1>
          <MapSelect label="Mapa actual" maps={actualMaps} value={actual?.id} onChange={(id) => choose('actual', id)} />
          <MapSelect label="Mapa futuro" maps={futureMaps} value={future?.id} onChange={(id) => choose('futuro', id)} />
          <Segmented
            label="Vista de ambos mapas"
            hideLabel
            value={view}
            onChange={setView}
            options={[
              { value: 'journey', label: 'Journey' },
              { value: 'blueprint', label: 'Blueprint' },
            ]}
          />
        </div>
      </header>

      {!actual ? (
        <EmptyState>Este proyecto no tiene mapas en estado actual para comparar.</EmptyState>
      ) : !future ? (
        <EmptyState>
          <p>Aún no hay un mapa futuro. Créalo a partir de “{actual.title}”: se copia completo para que lo transformes.</p>
          <Button
            variant="primary"
            icon="copy"
            className="mt-4"
            onClick={() => {
              const id = createFutureMap(project.id, actual.id)
              if (id) navigate(`/proyecto/${project.id}/comparar?actual=${actual.id}&futuro=${id}`, { replace: true })
            }}
          >
            Crear estado futuro
          </Button>
        </EmptyState>
      ) : (
        <main id="contenido" tabIndex={-1} className="flex min-h-0 flex-1">
          <MapPane project={project} map={actual} view={view} paneRef={leftRef} side="actual" />
          <ConnectionsPanel project={project} actual={actual} future={future} onShow={show} />
          <MapPane project={project} map={future} view={view} paneRef={rightRef} side="futuro" />
        </main>
      )}
    </div>
  )
}

function flash(container: RefObject<HTMLDivElement | null>, selector: string) {
  const el = container.current?.querySelector<HTMLElement>(selector)
  if (!el) return
  el.scrollIntoView({ block: 'center', inline: 'center', behavior: scrollBehavior() })
  el.classList.remove('card-flash')
  void el.offsetWidth // reinicia la animación si ya estaba activa
  el.classList.add('card-flash')
  setTimeout(() => el.classList.remove('card-flash'), 2600)
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto mt-16 max-w-lg rounded-panel border border-dashed border-line-strong bg-surface p-10 text-center text-ink-muted">
      {children}
    </div>
  )
}

function MapSelect({
  label,
  maps,
  value,
  onChange,
}: {
  label: string
  maps: JourneyMap[]
  value?: string
  onChange: (id: string) => void
}) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-semibold text-ink-muted">
        {label}
      </label>
      <select
        id={id}
        value={value ?? ''}
        disabled={maps.length === 0}
        onChange={(e) => onChange(e.target.value)}
        className="w-96 max-w-full rounded-md border border-line-strong bg-surface px-2.5 py-1.5 text-sm"
      >
        {maps.length === 0 && <option value="">Sin mapas</option>}
        {maps.map((m) => (
          <option key={m.id} value={m.id}>
            {m.title}
          </option>
        ))}
      </select>
    </div>
  )
}

/** Un mapa completo y editable, en tamaño compacto y con su propio scroll. */
function MapPane({
  project,
  map,
  view,
  paneRef,
  side,
}: {
  project: Project
  map: JourneyMap
  view: MapView
  paneRef: RefObject<HTMLDivElement | null>
  side: 'actual' | 'futuro'
}) {
  const [editingCardId, setEditingCardId] = useState<string | null>(null)
  return (
    <section aria-label={`Mapa ${side}`} className="flex min-w-0 flex-1 flex-col">
      <div
        className={`flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-line px-4 py-2 ${
          side === 'actual' ? 'bg-surface' : 'bg-primary-soft'
        }`}
      >
        <span
          className={`rounded px-1.5 py-0.5 text-[11px] font-bold tracking-wide uppercase ${
            side === 'actual' ? 'bg-ink text-white' : 'bg-primary text-white'
          }`}
        >
          {side === 'actual' ? 'Actual' : 'Futuro'}
        </span>
        <Link
          to={`/proyecto/${project.id}/mapa/${map.id}`}
          className="min-w-0 flex-1 truncate text-sm font-semibold hover:text-primary hover:underline"
        >
          {map.title}
        </Link>
        <SolidityMeter value={solidity(map, view)} compact />
      </div>
      <div ref={paneRef} className="min-h-0 flex-1 overflow-auto p-3">
        <EditorContext.Provider value={{ project, map, view, editingCardId, setEditingCardId, compact: true }}>
          <MapGrid />
        </EditorContext.Provider>
      </div>
    </section>
  )
}

/** Columna central: cada oportunidad del mapa actual se conecta con un paso del mapa futuro. */
function ConnectionsPanel({
  project,
  actual,
  future,
  onShow,
}: {
  project: Project
  actual: JourneyMap
  future: JourneyMap
  onShow: (cardId: string, stepId?: string) => void
}) {
  const setOpportunityLink = useStudioStore((s) => s.setOpportunityLink)
  const opportunities = opportunityCards(actual)
  const futureSteps = orderedSteps(future)
  const linkFor = (cardId: string) => future.opportunityLinks.find((l) => l.cardId === cardId)
  const connected = opportunities.filter(({ card }) => linkFor(card.id)).length
  const answeredSteps = new Set(
    future.opportunityLinks.filter((l) => l.sourceMapId === actual.id).map((l) => l.stepId),
  )
  const unanswered = futureSteps.filter((s) => !answeredSteps.has(s.id))

  return (
    <aside
      aria-label="Oportunidades conectadas con el mapa futuro"
      className="flex w-[340px] shrink-0 flex-col border-x border-line-strong bg-canvas"
    >
      <div className="border-b border-line bg-surface px-4 py-3">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold">
          Oportunidades <Icon name="arrowRight" size={14} /> pasos futuros
        </h2>
        <p className="mt-0.5 text-xs text-ink-muted tabular-nums">
          {connected} de {opportunities.length} oportunidades conectadas
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {opportunities.length === 0 ? (
          <p className="p-4 text-center text-sm text-ink-muted">
            El mapa actual no tiene oportunidades. Agrega tarjetas en el carril de oportunidades (o marca un carril como
            tal desde su menú).
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {opportunities.map(({ card, step }) => {
              const link = linkFor(card.id)
              const selectId = `link-${card.id}`
              return (
                <li
                  key={card.id}
                  className={`rounded-md border bg-surface p-2.5 ${link ? 'border-primary' : 'border-line'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[11px] text-ink-muted">{step.title}</span>
                    <BasisBadge basis={card.basis} />
                  </div>
                  <p className="mt-1 text-sm leading-snug">{card.text || <em>Tarjeta vacía</em>}</p>
                  <label htmlFor={selectId} className="mt-2 block text-xs font-semibold text-ink-muted">
                    Paso del mapa futuro
                  </label>
                  <div className="mt-1 flex gap-1.5">
                    <select
                      id={selectId}
                      value={link?.stepId ?? ''}
                      onChange={(e) => setOpportunityLink(project.id, future.id, actual.id, card.id, e.target.value || null)}
                      className="min-w-0 flex-1 rounded-md border border-line-strong bg-surface px-2 py-1 text-sm"
                    >
                      <option value="">Sin conectar</option>
                      {future.stages.map((stage) => (
                        <optgroup key={stage.id} label={stage.name}>
                          {futureSteps
                            .filter((s) => s.stageId === stage.id)
                            .map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.title}
                              </option>
                            ))}
                        </optgroup>
                      ))}
                    </select>
                    <Button
                      size="sm"
                      onClick={() => onShow(card.id, link?.stepId)}
                      aria-label={`Ver en los mapas: ${card.text}`}
                      title="Ver en los mapas"
                    >
                      Ver
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {unanswered.length > 0 && (
        <div className="border-t border-line bg-surface px-4 py-3 text-xs text-ink-muted">
          <p className="font-semibold text-ink">
            {unanswered.length} {unanswered.length === 1 ? 'paso futuro no responde' : 'pasos futuros no responden'} a
            ninguna oportunidad:
          </p>
          <p className="mt-1">{unanswered.map((s) => s.title).join(' · ')}</p>
        </div>
      )}
    </aside>
  )
}
