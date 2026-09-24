import { useId, useState, type ReactNode } from 'react'
import { PRINCIPLES, STATE_OPTIONS, ZOOM_OPTIONS } from '../../data/defaults'
import { formatDate, isExpired } from '../../lib/dates'
import { useStudioStore } from '../../store/useStudioStore'
import type { ResearchStatement } from '../../types'
import { IconButton } from '../ui/Button'
import { SelectField, TextArea, TextField } from '../ui/Field'
import { Icon } from '../ui/Icon'
import { useEditor } from '../map/EditorContext'

/** Panel lateral del mapa: ficha, declaración de investigación y los 6 principios. */
export function SidePanel({ onClose }: { onClose: () => void }) {
  return (
    <aside
      aria-label="Panel del mapa"
      className="flex w-[380px] shrink-0 flex-col border-l border-line bg-surface"
    >
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="font-semibold">Panel del mapa</h2>
        <IconButton icon="close" label="Cerrar panel" onClick={onClose} />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <Section title="Ficha del mapa">
          <MapInfoForm />
        </Section>
        <Section title="Declaración de investigación">
          <ResearchStatementForm />
        </Section>
        <PrinciplesSection />
      </div>
    </aside>
  )
}

function Section({ title, badge, children }: { title: string; badge?: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(true)
  const id = useId()
  return (
    <section className="border-b border-line">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold hover:bg-surface-muted"
        >
          <Icon name={open ? 'chevronDown' : 'chevronRight'} />
          <span className="flex-1">{title}</span>
          {badge}
        </button>
      </h3>
      <div id={id} hidden={!open} className="flex flex-col gap-3 px-4 pb-4">
        {children}
      </div>
    </section>
  )
}

function MapInfoForm() {
  const { project, map } = useEditor()
  const updateMap = useStudioStore((s) => s.updateMap)
  const update = (patch: Parameters<typeof updateMap>[2]) => updateMap(project.id, map.id, patch)
  const persona = project.personas.find((p) => p.id === map.personaId)

  return (
    <>
      <TextField label="Título" value={map.title} onChange={(e) => update({ title: e.target.value })} />
      <TextArea
        label="Pregunta de diseño"
        rows={2}
        placeholder="¿Cómo podríamos…?"
        value={map.designQuestion}
        onChange={(e) => update({ designQuestion: e.target.value })}
      />
      <SelectField
        label="Actor principal (persona)"
        value={map.personaId ?? ''}
        options={[{ value: '', label: 'Sin persona' }, ...project.personas.map((p) => ({ value: p.id, label: p.name }))]}
        onValueChange={(v) => update({ personaId: v || null })}
        hint={
          persona &&
          (isExpired(persona.expiresAt) ? (
            <span className="font-semibold text-critical">Venció el {formatDate(persona.expiresAt)}</span>
          ) : (
            `Vigente hasta el ${formatDate(persona.expiresAt)}`
          ))
        }
      />
      <TextArea label="Escenario" rows={3} value={map.scenario} onChange={(e) => update({ scenario: e.target.value })} />
      <div className="grid grid-cols-2 gap-3">
        <SelectField label="Zoom" value={map.zoom} options={ZOOM_OPTIONS} onValueChange={(zoom) => update({ zoom })} />
        <SelectField label="Estado" value={map.state} options={STATE_OPTIONS} onValueChange={(state) => update({ state })} />
      </div>
    </>
  )
}

function ResearchStatementForm() {
  const { project, map } = useEditor()
  const updateResearch = useStudioStore((s) => s.updateResearch)
  const rs = map.researchStatement
  const update = (patch: Partial<ResearchStatement>) => updateResearch(project.id, map.id, patch)
  const isEmpty = !rs.methods && rs.interviewCount === null && !rs.dateFrom && !rs.dateTo && !rs.places && !rs.triangulationNotes

  return (
    <>
      {isEmpty && (
        <p className="flex items-start gap-2 rounded-md border border-dashed border-assumption bg-assumption-soft p-2.5 text-xs text-assumption-ink">
          <Icon name="alert" className="mt-0.5" />
          Este mapa no tiene declaración de investigación. Sin ella, no se sabe en qué se apoya.
        </p>
      )}
      <TextArea
        label="Métodos"
        rows={2}
        placeholder="Entrevistas, observación, encuesta…"
        value={rs.methods}
        onChange={(e) => update({ methods: e.target.value })}
      />
      <TextField
        label="Número de entrevistas"
        type="number"
        min={0}
        inputMode="numeric"
        value={rs.interviewCount ?? ''}
        onChange={(e) => update({ interviewCount: e.target.value === '' ? null : Math.max(0, Number(e.target.value)) })}
      />
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Desde" type="date" value={rs.dateFrom} onChange={(e) => update({ dateFrom: e.target.value })} />
        <TextField label="Hasta" type="date" value={rs.dateTo} onChange={(e) => update({ dateTo: e.target.value })} />
      </div>
      <TextField label="Lugares" value={rs.places} onChange={(e) => update({ places: e.target.value })} />
      <TextArea
        label="Notas sobre triangulación"
        rows={4}
        hint="¿Qué hallazgos se confirman con más de un método o fuente? ¿Qué falta?"
        value={rs.triangulationNotes}
        onChange={(e) => update({ triangulationNotes: e.target.value })}
      />
    </>
  )
}

function PrinciplesSection() {
  const { project, map } = useEditor()
  const updatePrinciple = useStudioStore((s) => s.updatePrinciple)
  const done = map.principles.filter((p) => p.checked).length

  return (
    <Section
      title="Principios del diseño de servicios"
      badge={
        <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-ink-muted tabular-nums">
          {done} de {PRINCIPLES.length}
        </span>
      }
    >
      <p className="text-xs text-ink-muted">
        Marca los principios que este mapa cumple y anota por qué. Basado en <em>This is Service Design Doing</em>.
      </p>
      <ul className="flex flex-col gap-3">
        {PRINCIPLES.map((principle) => {
          const check = map.principles.find((p) => p.id === principle.id)
          const checked = check?.checked ?? false
          return (
            <li
              key={principle.id}
              className={`rounded-md border p-3 ${checked ? 'border-research bg-research-soft' : 'border-line'}`}
            >
              <label className="flex cursor-pointer items-start gap-2.5">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 shrink-0 accent-research"
                  checked={checked}
                  onChange={(e) => updatePrinciple(project.id, map.id, principle.id, { checked: e.target.checked })}
                />
                <span>
                  <span className="block text-sm font-semibold">{principle.name}</span>
                  <span className="block text-xs text-ink-muted">{principle.description}</span>
                </span>
              </label>
              <label className="sr-only" htmlFor={`note-${principle.id}`}>
                Nota sobre {principle.name}
              </label>
              <textarea
                id={`note-${principle.id}`}
                rows={2}
                placeholder="¿Por qué se cumple o qué falta?"
                value={check?.note ?? ''}
                onChange={(e) => updatePrinciple(project.id, map.id, principle.id, { note: e.target.value })}
                className="mt-2 w-full resize-y rounded border border-line-strong bg-surface px-2 py-1 text-xs"
              />
            </li>
          )
        })}
      </ul>
    </Section>
  )
}
