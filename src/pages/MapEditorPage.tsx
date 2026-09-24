import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { EditorContext } from '../components/map/EditorContext'
import { MapGrid } from '../components/map/MapGrid'
import { MapHeader } from '../components/map/MapHeader'
import { useProject } from '../lib/useProject'
import NotFound from './NotFound'

export default function MapEditorPage() {
  const { projectId, mapId } = useParams()
  const project = useProject(projectId)
  const map = project?.maps.find((m) => m.id === mapId)
  const [editingCardId, setEditingCardId] = useState<string | null>(null)

  if (!project || !map) return <NotFound message="Este mapa no existe." />

  return (
    <EditorContext.Provider value={{ project, map, view: 'journey', editingCardId, setEditingCardId }}>
      <div className="flex h-full flex-col">
        <MapHeader />
        <main className="min-h-0 flex-1 overflow-auto p-5" aria-label="Grilla del mapa">
          <MapGrid />
        </main>
      </div>
    </EditorContext.Provider>
  )
}
