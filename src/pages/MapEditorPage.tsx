import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { EditorContext } from '../components/map/EditorContext'
import { MapGrid } from '../components/map/MapGrid'
import { MapHeader } from '../components/map/MapHeader'
import { ViewToggle } from '../components/map/ViewToggle'
import { SidePanel } from '../components/panel/SidePanel'
import { Button } from '../components/ui/Button'
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

  if (!project || !map) return <NotFound message="Este mapa no existe." />

  return (
    <EditorContext.Provider value={{ project, map, view, editingCardId, setEditingCardId }}>
      <div className="flex h-full flex-col">
        <MapHeader
          actions={
            <div className="flex items-center gap-2">
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
