import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ExportMenu } from '../components/export/ExportMenu'
import { EditorContext } from '../components/map/EditorContext'
import { MapGrid } from '../components/map/MapGrid'
import { MapHeader } from '../components/map/MapHeader'
import { ViewToggle } from '../components/map/ViewToggle'
import { SidePanel } from '../components/panel/SidePanel'
import { Button } from '../components/ui/Button'
import { futureMapFor } from '../lib/map'
import { useProject } from '../lib/useProject'
import { useStudioStore } from '../store/useStudioStore'
import NotFound from './NotFound'

export default function MapEditorPage() {
  const { projectId, mapId } = useParams()
  const project = useProject(projectId)
  const map = project?.maps.find((m) => m.id === mapId)
  const view = useStudioStore((s) => (mapId ? s.mapViews[mapId] : undefined)) ?? 'journey'
  const [editingCardId, setEditingCardId] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(true)
  const setMapView = useStudioStore((s) => s.setMapView)
  const createFutureMap = useStudioStore((s) => s.createFutureMap)
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const targetCardId = params.get('tarjeta')

  // Si se llega desde una fuente (?tarjeta=…), se muestra y se resalta esa tarjeta.
  useEffect(() => {
    if (!map || !targetCardId) return
    const card = map.cards.find((c) => c.id === targetCardId)
    const lane = map.lanes.find((l) => l.id === card?.laneId)
    if (lane?.group === 'backstage') setMapView(map.id, 'blueprint')
    const timer = setTimeout(() => {
      const el = document.querySelector<HTMLElement>(`[data-card-id="${targetCardId}"]`)
      if (!el) return
      el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' })
      el.classList.add('card-flash')
      el.querySelector<HTMLElement>('button:last-of-type')?.focus({ preventScroll: true })
      setTimeout(() => el.classList.remove('card-flash'), 2600)
    }, 50)
    return () => clearTimeout(timer)
    // Solo al llegar con un enlace nuevo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetCardId])

  if (!project || !map) return <NotFound message="Este mapa no existe." />

  // Pareja para el comparador: el mapa base (si este es futuro) o su mapa futuro (si es actual).
  const compareUrl =
    map.state === 'futuro'
      ? `/proyecto/${project.id}/comparar?futuro=${map.id}${map.baseMapId ? `&actual=${map.baseMapId}` : ''}`
      : `/proyecto/${project.id}/comparar?actual=${map.id}${futureMapFor(project, map.id) ? `&futuro=${futureMapFor(project, map.id)!.id}` : ''}`

  return (
    <EditorContext.Provider value={{ project, map, view, editingCardId, setEditingCardId }}>
      <div className="flex h-full flex-col">
        <MapHeader
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {map.state === 'actual' && (
                <Button
                  size="sm"
                  icon="copy"
                  title="Copia este mapa como punto de partida del estado futuro"
                  onClick={() => {
                    const id = createFutureMap(project.id, map.id)
                    if (id) navigate(`/proyecto/${project.id}/mapa/${id}`)
                  }}
                >
                  Crear estado futuro
                </Button>
              )}
              <Button size="sm" icon="compare" onClick={() => navigate(compareUrl)}>
                Comparar
              </Button>
              <ExportMenu />
              <ViewToggle />
              <Button
                size="sm"
                icon="panel"
                aria-pressed={panelOpen}
                onClick={() => setPanelOpen((o) => !o)}
              >
                {panelOpen ? 'Ocultar panel' : 'Mostrar panel'}
              </Button>
            </div>
          }
        />
        <div className="flex min-h-0 flex-1">
          <main className="min-w-0 flex-1 overflow-auto p-5" aria-label="Grilla del mapa">
            <MapGrid />
          </main>
          {panelOpen && <SidePanel onClose={() => setPanelOpen(false)} />}
        </div>
      </div>
    </EditorContext.Provider>
  )
}
