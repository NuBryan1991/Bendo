import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { SolidityMeter, Tag } from '../components/ui/Badges'
import { PersonasTab } from '../components/personas/PersonasTab'
import { SourcesTab } from '../components/sources/SourcesTab'
import { Button, IconButton } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { TextArea, TextField } from '../components/ui/Field'
import { Popover } from '../components/ui/Popover'
import { Tabs } from '../components/ui/Tabs'
import { today } from '../lib/dates'
import { downloadFile, projectToJSON, slugify } from '../lib/projectIO'
import { solidity } from '../lib/map'
import { usePageTitle } from '../lib/usePageTitle'
import { useProject } from '../lib/useProject'
import { useStudioStore } from '../store/useStudioStore'
import type { Project } from '../types'
import NotFound from './NotFound'

type TabId = 'mapas' | 'personas' | 'fuentes'

export default function ProjectPage() {
  const { projectId } = useParams()
  const project = useProject(projectId)
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as TabId) || 'mapas'
  usePageTitle(project ? `${project.name} · ${tab[0].toUpperCase()}${tab.slice(1)}` : 'Proyecto no encontrado')

  if (!project) return <NotFound message="Este proyecto no existe." />

  return (
    <div className="min-h-full">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto max-w-5xl px-6 pt-5">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
            <Icon name="arrowLeft" /> Proyectos
          </Link>
          <ProjectHeading project={project} />
          <Tabs
            label="Secciones del proyecto"
            value={tab}
            onChange={(t) => setParams({ tab: t }, { replace: true })}
            tabs={[
              { value: 'mapas', label: 'Mapas', count: project.maps.length },
              { value: 'personas', label: 'Personas', count: project.personas.length },
              { value: 'fuentes', label: 'Fuentes', count: project.sources.length },
            ]}
          />
        </div>
      </header>
      <main id="contenido" tabIndex={-1} className="mx-auto max-w-5xl px-6 py-8">
        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
          {tab === 'mapas' && <MapsTab project={project} />}
          {tab === 'personas' && <PersonasTab project={project} />}
          {tab === 'fuentes' && <SourcesTab project={project} />}
        </div>
      </main>
    </div>
  )
}

function ProjectHeading({ project }: { project: Project }) {
  const updateProject = useStudioStore((s) => s.updateProject)
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div>
        <h1 className="text-2xl font-semibold">{project.name}</h1>
        {project.description && <p className="mt-1 max-w-3xl text-sm text-ink-muted">{project.description}</p>}
      </div>
      <div className="flex shrink-0 gap-2">
        <Button
          size="sm"
          title="Descarga el proyecto completo (mapas, personas y fuentes) para respaldarlo o compartirlo"
          onClick={() => downloadFile(projectToJSON(project), `${slugify(project.name)}-${today()}.json`)}
        >
          Exportar JSON
        </Button>
        <Popover
          label="Editar datos del proyecto"
          width={360}
          triggerClassName="inline-flex h-8 items-center gap-1.5 rounded-md border border-line-strong px-2.5 text-sm font-medium hover:bg-surface-muted"
          trigger={
            <>
              <Icon name="edit" /> Editar
            </>
          }
        >
          {() => (
            <div className="flex flex-col gap-3">
              <TextField
                label="Nombre del proyecto"
                value={project.name}
                onChange={(e) => updateProject(project.id, { name: e.target.value })}
              />
              <TextArea
                label="Descripción"
                value={project.description}
                onChange={(e) => updateProject(project.id, { description: e.target.value })}
              />
            </div>
          )}
        </Popover>
      </div>
    </div>
  )
}

function MapsTab({ project }: { project: Project }) {
  const createMap = useStudioStore((s) => s.createMap)
  const duplicateMap = useStudioStore((s) => s.duplicateMap)
  const deleteMap = useStudioStore((s) => s.deleteMap)
  const createFutureMap = useStudioStore((s) => s.createFutureMap)
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [creating, setCreating] = useState(false)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    const id = createMap(project.id, title.trim())
    if (id) navigate(`/proyecto/${project.id}/mapa/${id}`)
  }

  return (
    <section aria-label="Mapas">
      <div className="mb-4 flex justify-end">
        <Button variant="primary" icon="plus" onClick={() => setCreating(true)}>
          Nuevo mapa
        </Button>
      </div>
      {creating && (
        <form onSubmit={submit} className="mb-6 flex items-end gap-2 rounded-panel border border-line-strong bg-surface p-4">
          <div className="flex-1">
            <TextField label="Título del mapa" autoFocus required value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <Button type="submit" variant="primary" disabled={!title.trim()}>
            Crear
          </Button>
          <Button variant="ghost" onClick={() => setCreating(false)}>
            Cancelar
          </Button>
        </form>
      )}
      {project.maps.length === 0 ? (
        <p className="rounded-panel border border-dashed border-line-strong bg-surface p-10 text-center text-ink-muted">
          Este proyecto aún no tiene mapas.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {project.maps.map((m) => (
            <li key={m.id} className="flex items-center gap-4 rounded-panel border border-line bg-surface p-4">
              <div className="min-w-0 flex-1">
                <Link
                  to={`/proyecto/${project.id}/mapa/${m.id}`}
                  className="font-semibold text-ink hover:text-primary hover:underline"
                >
                  {m.title}
                </Link>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <Tag>{m.state === 'actual' ? 'Estado actual' : 'Estado futuro'}</Tag>
                  <Tag>Zoom: {m.zoom}</Tag>
                  <Tag>
                    {m.steps.length} pasos · {m.cards.length} tarjetas
                  </Tag>
                  {m.baseMapId && (
                    <Tag>Parte de: {project.maps.find((b) => b.id === m.baseMapId)?.title ?? 'mapa eliminado'}</Tag>
                  )}
                </div>
              </div>
              <SolidityMeter value={solidity(m, 'blueprint')} />
              <div className="flex items-center gap-1">
                {m.state === 'actual' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const id = createFutureMap(project.id, m.id)
                      if (id) navigate(`/proyecto/${project.id}/mapa/${id}`)
                    }}
                  >
                    Crear estado futuro
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  icon="compare"
                  onClick={() =>
                    navigate(
                      `/proyecto/${project.id}/comparar?${m.state === 'actual' ? `actual=${m.id}` : `futuro=${m.id}${m.baseMapId ? `&actual=${m.baseMapId}` : ''}`}`,
                    )
                  }
                >
                  Comparar
                </Button>
                <IconButton icon="copy" label={`Duplicar ${m.title}`} onClick={() => duplicateMap(project.id, m.id)} />
                <IconButton
                  icon="trash"
                  label={`Eliminar ${m.title}`}
                  onClick={() => {
                    if (confirm(`¿Eliminar el mapa "${m.title}"? No se puede deshacer.`)) deleteMap(project.id, m.id)
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
