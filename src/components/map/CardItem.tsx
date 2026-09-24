import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useEffect, useRef, type KeyboardEvent } from 'react'
import { sourceLabel, sourceTypeLabel } from '../../lib/map'
import { useStudioStore } from '../../store/useStudioStore'
import type { Card } from '../../types'
import { Button } from '../ui/Button'
import { Segmented, SelectField, TextField } from '../ui/Field'
import { Icon } from '../ui/Icon'
import { cardSurface } from './cardStyles'
import { useEditor } from './EditorContext'

export function CardItem({ card }: { card: Card }) {
  const { editingCardId } = useEditor()
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: `card:${card.id}`,
    data: { type: 'card', cardId: card.id, stepId: card.stepId, laneId: card.laneId },
    disabled: editingCardId === card.id,
  })
  const style = {
    transform: CSS.Translate.toString(transform),
    transition: transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-card-id={card.id}
      className={`rounded-card ${cardSurface(card)} ${isDragging ? 'opacity-40' : ''}`}
    >
      {editingCardId === card.id ? (
        <CardEditor card={card} />
      ) : (
        <CardView card={card} handleProps={{ ...attributes, ...listeners }} />
      )}
    </div>
  )
}

/** Contenido de la tarjeta en modo lectura (también se usa en la vista previa al arrastrar). */
export function CardView({
  card,
  handleProps,
}: {
  card: Card
  handleProps?: Record<string, unknown>
}) {
  const { setEditingCardId, project } = useEditor()
  const source = card.sourceId ? project.sources.find((s) => s.id === card.sourceId) : undefined

  return (
    <div className="flex flex-col gap-1.5 p-2">
      {card.imageUrl && (
        <img src={card.imageUrl} alt="" className="h-20 w-full rounded object-cover" loading="lazy" />
      )}
      <div className="flex items-start gap-1">
        <button
          type="button"
          aria-label="Mover tarjeta (arrastra o pulsa Espacio y usa las flechas)"
          className="mt-0.5 cursor-grab rounded p-0.5 text-ink-muted hover:bg-black/5 active:cursor-grabbing"
          {...handleProps}
        >
          <Icon name="grip" size={14} />
        </button>
        <button
          type="button"
          onClick={() => setEditingCardId(card.id)}
          className="min-w-0 flex-1 rounded text-left text-[13px] leading-snug text-ink hover:underline"
          aria-label={`Editar tarjeta: ${card.text || 'vacía'}`}
        >
          {card.text || <span className="italic text-ink-muted">Tarjeta vacía</span>}
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-1 pl-5 text-[11px]">
        <span className={`font-semibold ${card.basis === 'investigación' ? 'text-research-ink' : 'text-assumption-ink'}`}>
          {card.basis === 'investigación' ? 'Investigación' : 'Supuesto'}
        </span>
        <span className="text-ink-muted">· {card.dataType === 'crudo' ? 'Crudo' : 'Interpretado'}</span>
      </div>
      {source && (
        <p className="flex items-center gap-1 pl-5 text-[11px] text-ink-muted" title={`Fuente: ${sourceLabel(source)}`}>
          <Icon name="link" size={11} />
          <span className="truncate">{source.participant || sourceTypeLabel(source.type)}</span>
        </p>
      )}
    </div>
  )
}

function CardEditor({ card }: { card: Card }) {
  const { project, map, setEditingCardId } = useEditor()
  const updateCard = useStudioStore((s) => s.updateCard)
  const deleteCard = useStudioStore((s) => s.deleteCard)
  const textRef = useRef<HTMLTextAreaElement>(null)
  const update = (patch: Parameters<typeof updateCard>[3]) => updateCard(project.id, map.id, card.id, patch)

  useEffect(() => {
    const el = textRef.current
    if (!el) return
    el.focus()
    el.setSelectionRange(el.value.length, el.value.length)
  }, [])

  const close = () => {
    // Una tarjeta que se cierra vacía se descarta.
    if (!card.text.trim() && !card.imageUrl) deleteCard(project.id, map.id, card.id)
    setEditingCardId(null)
    // Devuelve el foco a la tarjeta para seguir navegando con teclado.
    requestAnimationFrame(() =>
      document.querySelector<HTMLElement>(`[data-card-id="${card.id}"] button:last-of-type`)?.focus(),
    )
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      close()
    }
  }

  return (
    <div className="flex flex-col gap-2 p-2" onKeyDown={onKeyDown}>
      <label className="sr-only" htmlFor={`card-text-${card.id}`}>
        Texto de la tarjeta
      </label>
      <textarea
        id={`card-text-${card.id}`}
        ref={textRef}
        value={card.text}
        rows={3}
        placeholder="Escribe el contenido…"
        onChange={(e) => update({ text: e.target.value })}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) close()
        }}
        className="w-full resize-y rounded border border-line-strong bg-surface px-2 py-1 text-[13px]"
      />
      <SelectField
        label="Fuente"
        value={card.sourceId ?? ''}
        onValueChange={(sourceId) => update({ sourceId: sourceId || undefined })}
        options={[
          { value: '', label: 'Sin fuente' },
          ...project.sources.map((s) => ({ value: s.id, label: sourceLabel(s) })),
        ]}
        hint={project.sources.length === 0 ? 'Registra fuentes en la pestaña Fuentes del proyecto.' : undefined}
      />
      <Segmented
        label="Basis"
        value={card.basis}
        disabled={Boolean(card.sourceId)}
        onChange={(basis) => update({ basis })}
        options={[
          { value: 'supuesto', label: 'Supuesto' },
          { value: 'investigación', label: 'Investigación' },
        ]}
      />
      {card.sourceId && (
        <p className="-mt-1 text-[11px] text-ink-muted">Tiene una fuente vinculada: siempre es investigación.</p>
      )}
      <Segmented
        label="Tipo de dato"
        value={card.dataType}
        onChange={(dataType) => update({ dataType })}
        options={[
          { value: 'crudo', label: 'Crudo' },
          { value: 'interpretado', label: 'Interpretado' },
        ]}
      />
      <TextField
        label="Imagen (URL, opcional)"
        type="url"
        value={card.imageUrl ?? ''}
        onChange={(e) => update({ imageUrl: e.target.value || undefined })}
      />
      <div className="flex justify-between gap-2 pt-1">
        <Button
          size="sm"
          variant="danger"
          icon="trash"
          onClick={() => {
            deleteCard(project.id, map.id, card.id)
            setEditingCardId(null)
          }}
        >
          Eliminar
        </Button>
        <Button size="sm" variant="primary" onClick={close}>
          Listo
        </Button>
      </div>
    </div>
  )
}
