import type { ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ImagePicker, ListEditor, Portrait, StatsEditor } from '../components/personas/PersonaParts'
import { PersonaSheet } from '../components/personas/PersonaSheet'
import { Button, IconButton } from '../components/ui/Button'
import { Segmented, TextArea, TextField } from '../components/ui/Field'
import { Icon } from '../components/ui/Icon'
import { addMonths, formatDate, isExpired, today } from '../lib/dates'
import { usePageTitle } from '../lib/usePageTitle'
import { useProject } from '../lib/useProject'
import { STORAGE_LIMIT_BYTES, useSaveStatus } from '../store/saveStatus'
import { useStudioStore } from '../store/useStudioStore'
import type { Persona } from '../types'
import NotFound from './NotFound'

export default function PersonaPage() {
  const { projectId, personaId } = useParams()
  const project = useProject(projectId)
  const persona = project?.personas.find((p) => p.id === personaId)
  const updatePersona = useStudioStore((s) => s.updatePersona)
  const duplicatePersona = useStudioStore((s) => s.duplicatePersona)
  const deletePersona = useStudioStore((s) => s.deletePersona)
  const bytes = useSaveStatus((s) => s.bytes)
  const navigate = useNavigate()
  usePageTitle(persona ? persona.name : 'Persona no encontrada')

  if (!project || !persona) return <NotFound message="Esta persona no existe." />

  const update = (patch: Partial<Omit<Persona, 'id'>>) => updatePersona(project.id, persona.id, patch)
  const usedIn = project.maps.filter((m) => m.personaId === persona.id)
  const expired = isExpired(persona.expiresAt)
  const renew = () => update({ expiresAt: addMonths(today(), 12) })

  return (
    <div className="min-h-full">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <nav aria-label="Ruta" className="flex flex-wrap items-center gap-1 text-sm text-ink-muted">
            <Link to="/" className="hover:text-ink hover:underline">
              Proyectos
            </Link>
            <Icon name="chevronRight" size={12} />
            <Link to={`/proyecto/${project.id}?tab=personas`} className="hover:text-ink hover:underline">
              {project.name} · Personas
            </Link>
          </nav>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold [overflow-wrap:anywhere]">{persona.name || 'Sin nombre'}</h1>
            <div className="flex gap-2">
              <Button
                size="sm"
                icon="copy"
                onClick={() => {
                  const id = duplicatePersona(project.id, persona.id)
                  if (id) navigate(`/proyecto/${project.id}/persona/${id}`)
                }}
              >
                Duplicar
              </Button>
              <Button
                size="sm"
                variant="danger"
                icon="trash"
                onClick={() => {
                  const extra = usedIn.length ? ` ${usedIn.length} mapa(s) quedarán sin actor principal.` : ''
                  if (confirm(`¿Eliminar la persona "${persona.name}"?${extra}`)) {
                    deletePersona(project.id, persona.id)
                    navigate(`/proyecto/${project.id}?tab=personas`)
                  }
                }}
              >
                Eliminar
              </Button>
            </div>
          </div>
        </div>
        {expired && (
          <div role="alert" className="border-t border-critical bg-critical-soft">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-6 py-2 text-sm text-critical">
              <Icon name="alert" />
              <span className="flex-1">
                <strong>Esta persona venció el {formatDate(persona.expiresAt)}.</strong> Revísala con investigación
                reciente y, cuando esté al día, renueva su vigencia.
              </span>
              <Button size="sm" onClick={renew}>
                Renovar 12 meses
              </Button>
            </div>
          </div>
        )}
      </header>

      <main id="contenido" tabIndex={-1} className="mx-auto grid max-w-6xl gap-8 px-6 py-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          <Section title="Identidad">
            <TextField label="Nombre" value={persona.name} onChange={(e) => update({ name: e.target.value })} />
            <TextField
              label="Datos demográficos"
              placeholder="34 años · Consultora · Viaja 2–3 veces al mes"
              value={persona.demographics}
              onChange={(e) => update({ demographics: e.target.value })}
            />
            <TextArea label="Cita" rows={2} value={persona.quote} onChange={(e) => update({ quote: e.target.value })} />
            <TextArea
              label="Descripción"
              rows={4}
              value={persona.description}
              onChange={(e) => update({ description: e.target.value })}
            />
          </Section>

          <Section title="Retrato">
            <div className="flex items-center gap-4">
              <Portrait persona={persona} size={72} />
              {persona.portrait && (
                <Button size="sm" variant="ghost" icon="trash" onClick={() => update({ portrait: '' })}>
                  Quitar retrato
                </Button>
              )}
            </div>
            <ImagePicker label="Nuevo retrato (URL o archivo)" maxSide={400} onPick={(portrait) => update({ portrait })} />
          </Section>

          <Section title="Necesidades, motivaciones y frustraciones">
            <ListEditor label="Necesidades" placeholder="Saber en qué estado está su reclamo" items={persona.needs} onChange={(needs) => update({ needs })} />
            <ListEditor label="Motivaciones" placeholder="Seguir con su agenda" items={persona.motivations} onChange={(motivations) => update({ motivations })} />
            <ListEditor label="Frustraciones" placeholder="Repetir la misma información" items={persona.frustrations} onChange={(frustrations) => update({ frustrations })} />
          </Section>

          <Section title="Estadísticas">
            <StatsEditor stats={persona.stats} onChange={(stats) => update({ stats })} />
          </Section>

          <Section title="Imágenes de contexto">
            {persona.contextImages.length > 0 && (
              <ul className="grid grid-cols-3 gap-2">
                {persona.contextImages.map((src, i) => (
                  <li key={i} className="relative">
                    <img src={src} alt={`Imagen de contexto ${i + 1}`} className="aspect-[4/3] w-full rounded-md border border-line object-cover" />
                    <IconButton
                      icon="trash"
                      label={`Quitar imagen de contexto ${i + 1}`}
                      className="absolute top-1 right-1 bg-surface shadow"
                      onClick={() => update({ contextImages: persona.contextImages.filter((_, j) => j !== i) })}
                    />
                  </li>
                ))}
              </ul>
            )}
            <ImagePicker
              label="Agregar imagen (URL o archivo)"
              maxSide={1000}
              onPick={(src) => update({ contextImages: [...persona.contextImages, src] })}
            />
            <p className="text-xs text-ink-muted">
              Espacio usado en este navegador: {(bytes / 1024 / 1024).toFixed(1)} MB de ~{STORAGE_LIMIT_BYTES / 1024 / 1024}{' '}
              MB. Las imágenes subidas se reducen solas; las URL no ocupan espacio.
            </p>
          </Section>

          <Section title="Evidencia y vigencia">
            <Segmented
              label="¿En qué se basa esta persona?"
              value={persona.basis}
              onChange={(basis) => update({ basis })}
              options={[
                { value: 'supuesto', label: 'Supuesto' },
                { value: 'investigación', label: 'Investigación' },
              ]}
            />
            <p className="-mt-1 text-xs text-ink-muted">
              Una persona de supuestos (proto-persona) sirve para empezar; márcala como investigación cuando la
              respalden datos reales.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <TextField
                label="Fecha de creación"
                type="date"
                value={persona.createdAt}
                onChange={(e) => e.target.value && update({ createdAt: e.target.value })}
              />
              <TextField
                label="Fecha de caducidad"
                type="date"
                value={persona.expiresAt}
                onChange={(e) => e.target.value && update({ expiresAt: e.target.value })}
              />
            </div>
            <Button size="sm" className="self-start" onClick={renew}>
              Renovar: vigente 12 meses desde hoy
            </Button>
            <div className="text-sm">
              <p className="font-semibold">Mapas donde es actor principal</p>
              {usedIn.length ? (
                <ul className="mt-1 list-disc pl-5">
                  {usedIn.map((m) => (
                    <li key={m.id}>
                      <Link to={`/proyecto/${project.id}/mapa/${m.id}`} className="inline-block py-1 text-primary underline">
                        {m.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-ink-muted">Ninguno todavía. Asígnala desde el panel lateral de un mapa.</p>
              )}
            </div>
          </Section>
        </div>

        <aside aria-label="Vista previa de la ficha" className="lg:sticky lg:top-6 lg:self-start">
          <p className="mb-2 text-xs font-semibold tracking-wide text-ink-muted uppercase">Vista previa</p>
          <PersonaSheet persona={persona} />
        </aside>
      </main>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-panel border border-line bg-surface p-5">
      <h2 className="font-semibold">{title}</h2>
      {children}
    </section>
  )
}
