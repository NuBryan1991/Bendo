import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, IconButton } from '../components/ui/Button'
import { TextArea, TextField } from '../components/ui/Field'
import { formatDate } from '../lib/dates'
import { usePageTitle } from '../lib/usePageTitle'
import { ImportError, projectsFromJSON } from '../lib/projectIO'
import { useStudioStore } from '../store/useStudioStore'

export default function HomePage() {
  const projects = useStudioStore((s) => s.projects)
  const createProject = useStudioStore((s) => s.createProject)
  const duplicateProject = useStudioStore((s) => s.duplicateProject)
  const deleteProject = useStudioStore((s) => s.deleteProject)
  const addSampleProject = useStudioStore((s) => s.addSampleProject)
  const importProject = useStudioStore((s) => s.importProject)
  const navigate = useNavigate()
  usePageTitle('Proyectos')
  const fileRef = useRef<HTMLInputElement>(null)
  const [importError, setImportError] = useState<string | null>(null)

  const onImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // permite volver a elegir el mismo archivo
    if (!file) return
    try {
      const projects = projectsFromJSON(await file.text())
      setImportError(null)
      // Un proyecto: se abre. Varios (copia de seguridad): se quedan en la lista de Inicio.
      const ids = projects.reverse().map((p) => importProject(p))
      if (ids.length === 1) navigate(`/proyecto/${ids[0]}`)
    } catch (err) {
      setImportError(err instanceof ImportError ? err.message : 'No se pudo leer el archivo.')
    }
  }

  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    const id = createProject(name.trim(), description.trim())
    navigate(`/proyecto/${id}`)
  }

  return (
    <div className="min-h-full">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-5">
          <div>
            <h1 className="text-xl font-semibold">Journey Map Studio</h1>
            <p className="text-sm text-ink-muted">Journey maps y blueprints que distinguen investigación de supuestos.</p>
          </div>
          <div className="flex gap-2">
            <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={onImport} />
            <Button onClick={() => fileRef.current?.click()}>Importar proyecto (JSON)</Button>
            <Button variant="primary" icon="plus" onClick={() => setCreating(true)}>
              Nuevo proyecto
            </Button>
          </div>
        </div>
      </header>

      <main id="contenido" tabIndex={-1} className="mx-auto max-w-5xl px-6 py-8">
        {importError && (
          <p role="alert" className="mb-6 rounded-md border border-critical bg-critical-soft px-4 py-3 text-sm text-critical">
            <strong>No se pudo importar.</strong> {importError}
          </p>
        )}
        {creating && (
          <form
            onSubmit={submit}
            className="mb-8 flex flex-col gap-3 rounded-panel border border-line-strong bg-surface p-5"
            aria-label="Nuevo proyecto"
          >
            <h2 className="font-semibold">Nuevo proyecto</h2>
            <TextField label="Nombre" required autoFocus value={name} onChange={(e) => setName(e.target.value)} />
            <TextArea label="Descripción" value={description} onChange={(e) => setDescription(e.target.value)} />
            <div className="flex gap-2">
              <Button type="submit" variant="primary" disabled={!name.trim()}>
                Crear proyecto
              </Button>
              <Button variant="ghost" onClick={() => setCreating(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        )}

        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Proyectos</h2>
          <Button size="sm" variant="ghost" onClick={() => navigate(`/proyecto/${addSampleProject()}`)}>
            Cargar proyecto de ejemplo
          </Button>
        </div>

        {projects.length === 0 ? (
          <p className="rounded-panel border border-dashed border-line-strong bg-surface p-10 text-center text-ink-muted">
            Aún no hay proyectos. Crea uno o carga el proyecto de ejemplo.
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {projects.map((p) => (
              <li key={p.id} className="flex flex-col rounded-panel border border-line bg-surface p-5 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <Link to={`/proyecto/${p.id}`} className="text-lg font-semibold text-ink hover:text-primary hover:underline">
                    {p.name}
                  </Link>
                  <div className="flex shrink-0 gap-1">
                    <IconButton icon="copy" label={`Duplicar ${p.name}`} onClick={() => duplicateProject(p.id)} />
                    <IconButton
                      icon="trash"
                      label={`Eliminar ${p.name}`}
                      onClick={() => {
                        if (confirm(`¿Eliminar el proyecto "${p.name}" y todos sus mapas? No se puede deshacer.`))
                          deleteProject(p.id)
                      }}
                    />
                  </div>
                </div>
                {p.description && <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{p.description}</p>}
                <p className="mt-auto pt-4 text-xs text-ink-muted">
                  {p.maps.length} {p.maps.length === 1 ? 'mapa' : 'mapas'} · {p.personas.length}{' '}
                  {p.personas.length === 1 ? 'persona' : 'personas'} · {p.sources.length}{' '}
                  {p.sources.length === 1 ? 'fuente' : 'fuentes'} · Actualizado {formatDate(p.updatedAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
