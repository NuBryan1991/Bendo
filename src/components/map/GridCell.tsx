import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { cardsInCell } from '../../lib/map'
import { useStudioStore } from '../../store/useStudioStore'
import type { Lane, Step } from '../../types'
import { Icon } from '../ui/Icon'
import { CardItem } from './CardItem'
import { useEditor } from './EditorContext'

/** Celda de la grilla (paso × carril): contiene tarjetas ordenables y recibe tarjetas arrastradas. */
export function GridCell({ step, lane }: { step: Step; lane: Lane }) {
  const { project, map, setEditingCardId } = useEditor()
  const addCard = useStudioStore((s) => s.addCard)
  const cards = cardsInCell(map, step.id, lane.id)
  const { setNodeRef, isOver } = useDroppable({
    id: `cell:${step.id}:${lane.id}`,
    data: { type: 'cell', stepId: step.id, laneId: lane.id },
  })

  return (
    <div
      ref={setNodeRef}
      className={`group flex min-h-20 flex-col gap-1.5 border-r border-b border-line p-1.5 ${
        lane.group === 'backstage' ? 'bg-surface-muted' : 'bg-surface'
      } ${isOver ? 'outline-2 -outline-offset-2 outline-primary' : ''}`}
    >
      <SortableContext items={cards.map((c) => `card:${c.id}`)} strategy={verticalListSortingStrategy}>
        {cards.map((c) => (
          <CardItem key={c.id} card={c} />
        ))}
      </SortableContext>
      <button
        type="button"
        onClick={() => setEditingCardId(addCard(project.id, map.id, step.id, lane.id) ?? null)}
        aria-label={`Agregar tarjeta en ${lane.name}, paso ${step.title}`}
        className="mt-auto flex items-center justify-center gap-1 rounded border border-dashed border-transparent py-1 text-xs text-ink-muted opacity-60 hover:border-line-strong hover:text-ink hover:opacity-100 focus-visible:opacity-100 group-hover:opacity-100"
      >
        <Icon name="plus" size={12} /> Tarjeta
      </button>
    </div>
  )
}

/** Celda de relleno bajo una etapa vacía. */
export function EmptyCell({ backstage }: { backstage: boolean }) {
  return <div className={`min-h-20 border-r border-b border-line ${backstage ? 'bg-surface-muted' : 'bg-surface'}`} />
}
