import { useId, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { newSource, SOURCE_TYPE_OPTIONS } from '../../data/defaults'
import { formatDate } from '../../lib/dates'
import { cardsBySource, sourceTypeLabel, type SourceBacklink } from '../../lib/map'
import { useStudioStore } from '../../store/useStudioStore'
import type { Project, Source, SourceType } from '../../types'
import { BasisBadge } from '../ui/Badges'
import { Button, IconButton } from '../ui/Button'
import { SelectField, TextArea, TextField } from '../ui/Field'
import { Icon } from '../ui/Icon'

type Filter = SourceType | 'todas'

/** Pestaña Fuentes: registro de la evidencia del proyecto y qué tarjetas respalda cada fuente. */
export function SourcesTab({ project }: { project: Project }) {
  const addSource = useStudioStore((s) => s.addSource)
  const [creating, setCreating] = useState(false)
  const [filter, setFilter] = useState<Filter>('todas')
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()
  const visible = project.sources.filter(
    (s) =>
      (filter === 'todas' || s.type === filter) &&
      (!q || `${s.participant} ${s.note} ${s.link}`.toLowerCase().includes(q)),
  )
  const linkedCards = project.maps.reduce((n, m) => n + m.cards.filter((c) => c.sourceId).length, 0)
  const totalCards = project.maps.reduce((n, m) => n + m.cards.length, 0)

  return (
    <section aria-label="Fuentes">
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="w-44">
          <SelectField<Filter>
            label="Tipo"
            value={filter}
            onValueChange={setFilter}
            options={[{ value: 'todas', label: 'Todas' }, ...SOURCE_TYPE_OPTIONS]}
          />
        </div>
        <div className="w-64">
          <TextField label="Buscar" type="search" placeholder="Participante, nota…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <p className="flex-1 text-sm text-ink-muted">
          {linkedCards} de {totalCards} tarjetas del proyecto citan una fuente.
        </p>
        <Button variant="primary" icon="plus" onClick={() => setCreating(true)} disabled={creating}>
          Nueva fuente
        </Button>
      </div>

      {creating && (
        <div className="mb-4 rounded-panel border border-primary bg-surface p-4">
          <h2 className="mb-3 font-semibold">Nueva fuente</h2>
          <SourceForm
            initial={newSource()}
            submitLabel="Guardar fuente"
            onSubmit={(data) => {
              addSource(project.id, data)
              setCreating(false)
            }}
            onCancel={() => setCreating(false)}
          />
        </div>
      )}

      {project.sources.length === 0 ? (
        <p className="rounded-panel border border-dashed border-line-strong bg-surface p-10 text-center text-ink-muted">
          Aún no hay fuentes. Registra entrevistas, observaciones, encuestas, analítica o documentos para respaldar tus
          tarjetas.
        </p>
      ) : visible.length === 0 ? (
        <p className="p-6 text-center text-ink-muted">Ninguna fuente coincide con el filtro.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((s) => (
            <SourceItem key={s.id} project={project} source={s} />
          ))}
        </ul>
      )}
    </section>
  )
}

function SourceItem({ project, source }: { project: Project; source: Source }) {
  const updateSource = useStudioStore((s) => s.updateSource)
  const deleteSource = useStudioStore((s) => s.deleteSource)
  const [editing, setEditing] = useState(false)
  const [showCards, setShowCards] = useState(false)
  const listId = useId()
  const backlinks = cardsBySource(project, source.id)

  if (editing) {
    return (
      <li className="rounded-panel border border-primary bg-surface p-4">
        <SourceForm
          initial={source}
          submitLabel="Guardar cambios"
          onSubmit={(data) => {
            updateSource(project.id, source.id, data)
            setEditing(false)
          }}
          onCancel={() => setEditing(false)}
        />
      </li>
    )
  }

  return (
    <li className="rounded-panel border border-line bg-surface">
      <div className="flex items-start gap-4 p-4">
        <span className="mt-0.5 w-24 shrink-0 rounded bg-surface-muted px-2 py-1 text-center text-xs font-semibold text-ink">
          {sourceTypeLabel(source.type)}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold">{source.participant || 'Sin participante'}</h2>
          <p className="text-xs text-ink-muted">{source.date ? formatDate(source.date) : 'Sin fecha'}</p>
          {source.note && <p className="mt-1.5 text-sm">{source.note}</p>}
          {source.link && !/^https?:\/\//i.test(source.link) && (
            <p className="mt-1.5 truncate text-sm text-ink-muted">{source.link}</p>
          )}
          {/^https?:\/\//i.test(source.link) && (
            <a
              href={source.link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 inline-flex max-w-full items-center gap-1 text-sm text-primary underline"
            >
              <Icon name="link" size={13} />
              <span className="truncate">{source.link}</span>
              <span className="sr-only">(se abre en una pestaña nueva)</span>
            </a>
          )}
        </div>
        <div className="flex shrink-0 gap-1">
          <IconButton icon="edit" label={`Editar fuente ${source.participant}`} onClick={() => setEditing(true)} />
          <IconButton
            icon="trash"
            label={`Eliminar fuente ${source.participant}`}
            onClick={() => {
              const msg = backlinks.length
                ? `¿Eliminar esta fuente? ${backlinks.length} tarjetas quedarán sin fuente (conservarán su basis actual).`
                : '¿Eliminar esta fuente?'
              if (confirm(msg)) deleteSource(project.id, source.id)
            }}
          />
        </div>
      </div>

      <div className="border-t border-line px-4 py-2">
        {backlinks.length === 0 ? (
          <p className="text-sm text-ink-muted">Todavía no respalda ninguna tarjeta.</p>
        ) : (
          <button
            type="button"
            aria-expanded={showCards}
            aria-controls={listId}
            onClick={() => setShowCards((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded text-sm font-medium text-research-ink hover:underline"
          >
            <Icon name={showCards ? 'chevronDown' : 'chevronRight'} />
            Respalda {backlinks.length} {backlinks.length === 1 ? 'tarjeta' : 'tarjetas'}
          </button>
        )}
        {showCards && <BacklinkList id={listId} projectId={project.id} backlinks={backlinks} />}
      </div>
    </li>
  )
}

/** Tarjetas que cita una fuente, agrupadas por mapa, con enlace directo a cada tarjeta. */
function BacklinkList({ id, projectId, backlinks }: { id: string; projectId: string; backlinks: SourceBacklink[] }) {
  const byMap = new Map<string, SourceBacklink[]>()
  backlinks.forEach((b) => byMap.set(b.map.id, [...(byMap.get(b.map.id) ?? []), b]))

  return (
    <div id={id} className="mt-2 flex flex-col gap-3 pb-2">
      {[...byMap.values()].map((items) => (
        <div key={items[0].map.id}>
          <h3 className="mb-1.5 text-xs font-semibold tracking-wide text-ink-muted uppercase">{items[0].map.title}</h3>
          <ul className="flex flex-col gap-1.5">
            {items.map(({ card, step, lane, map }) => (
              <li key={card.id}>
                <Link
                  to={`/proyecto/${projectId}/mapa/${map.id}?tarjeta=${card.id}`}
                  className="flex items-start gap-3 rounded-md border border-line p-2 hover:border-primary hover:bg-primary-soft"
                >
                  <span className="w-44 shrink-0 text-xs text-ink-muted">
                    <span className="block font-semibold text-ink">{step?.title}</span>
                    {lane?.name}
                  </span>
                  <span className="min-w-0 flex-1 text-sm">{card.text || <em>Tarjeta vacía</em>}</span>
                  <BasisBadge basis={card.basis} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

function SourceForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: Source
  submitLabel: string
  onSubmit: (data: Omit<Source, 'id'>) => void
  onCancel: () => void
}) {
  const [data, setData] = useState<Omit<Source, 'id'>>({
    type: initial.type,
    date: initial.date,
    participant: initial.participant,
    note: initial.note,
    link: initial.link,
  })
  const set = (patch: Partial<Omit<Source, 'id'>>) => setData((d) => ({ ...d, ...patch }))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit({ ...data, participant: data.participant.trim(), link: data.link.trim() })
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <SelectField label="Tipo" value={data.type} options={SOURCE_TYPE_OPTIONS} onValueChange={(type) => set({ type })} />
      <TextField label="Fecha" type="date" value={data.date} onChange={(e) => set({ date: e.target.value })} />
      <TextField
        label="Participante"
        autoFocus
        placeholder="P1 · Camila / Mostrador T2"
        value={data.participant}
        onChange={(e) => set({ participant: e.target.value })}
      />
      <div className="sm:col-span-3">
        <TextArea label="Nota" rows={3} value={data.note} onChange={(e) => set({ note: e.target.value })} />
      </div>
      <div className="sm:col-span-3">
        <TextField
          label="Enlace"
          type="url"
          placeholder="https://… (grabación, transcripción, informe)"
          value={data.link}
          onChange={(e) => set({ link: e.target.value })}
        />
      </div>
      <div className="flex gap-2 sm:col-span-3">
        <Button type="submit" variant="primary">
          {submitLabel}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
