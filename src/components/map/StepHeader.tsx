import { useDroppable } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { EMOTION_OPTIONS, STEP_TYPE_OPTIONS } from '../../data/defaults'
import { useStudioStore } from '../../store/useStudioStore'
import type { Stage, Step } from '../../types'
import { Button } from '../ui/Button'
import { SelectField, TextField } from '../ui/Field'
import { Icon } from '../ui/Icon'
import { Popover } from '../ui/Popover'
import { useEditor } from './EditorContext'

export function StepHeader({ step }: { step: Step }) {
  const sortable = useSortable({
    id: `step:${step.id}`,
    data: { type: 'step', stepId: step.id, stageId: step.stageId },
  })
  const style = { transform: CSS.Translate.toString(sortable.transform), transition: sortable.transition }

  return (
    <div
      ref={sortable.setNodeRef}
      style={style}
      className={`relative z-[1] border-r border-b border-line bg-surface ${sortable.isDragging ? 'opacity-40' : ''}`}
    >
      <StepHeaderContent step={step} handleProps={{ ...sortable.attributes, ...sortable.listeners }} />
    </div>
  )
}

/** Contenido de la cabecera del paso (también se usa en la vista previa al arrastrar). */
export function StepHeaderContent({ step, handleProps }: { step: Step; handleProps?: Record<string, unknown> }) {
  const critical = step.emotion === -2
  return (
    <div
      className={`flex h-full flex-col gap-1.5 border-t-4 p-2 ${
        step.momentOfTruth ? 'border-t-moment bg-moment-soft' : critical ? 'border-t-critical' : 'border-t-transparent'
      }`}
    >
      <div className="flex items-start gap-1">
        <button
          type="button"
          aria-label={`Mover paso ${step.title} (arrastra o pulsa Espacio y usa las flechas)`}
          className="mt-0.5 cursor-grab rounded p-0.5 text-ink-muted hover:bg-black/5 active:cursor-grabbing"
          {...handleProps}
        >
          <Icon name="grip" size={14} />
        </button>
        <span className="min-w-0 flex-1 text-sm leading-snug font-semibold">{step.title || 'Sin título'}</span>
        {handleProps && <StepMenu step={step} />}
      </div>
      <div className="flex flex-wrap gap-1 pl-5">
        {step.momentOfTruth && (
          <span className="inline-flex items-center gap-0.5 rounded bg-moment px-1.5 py-0.5 text-[11px] font-semibold text-white">
            <Icon name="star" size={11} /> Momento de la verdad
          </span>
        )}
        {critical && (
          <span className="inline-flex items-center gap-0.5 rounded bg-critical px-1.5 py-0.5 text-[11px] font-semibold text-white">
            <Icon name="alert" size={11} /> Punto crítico
          </span>
        )}
        {step.type === 'fuera de la organización' && (
          <span className="rounded border border-line-strong px-1.5 py-0.5 text-[11px] text-ink-muted">
            Fuera de la organización
          </span>
        )}
      </div>
    </div>
  )
}

function StepMenu({ step }: { step: Step }) {
  const { project, map } = useEditor()
  const updateStep = useStudioStore((s) => s.updateStep)
  const addStep = useStudioStore((s) => s.addStep)
  const deleteStep = useStudioStore((s) => s.deleteStep)
  const update = (patch: Parameters<typeof updateStep>[3]) => updateStep(project.id, map.id, step.id, patch)
  const cardCount = map.cards.filter((c) => c.stepId === step.id).length

  return (
    <Popover
      label={`Editar paso ${step.title}`}
      trigger={<Icon name="edit" size={14} />}
      triggerClassName="rounded p-1 text-ink-muted hover:bg-black/5 hover:text-ink"
    >
      {(close) => (
        <div className="flex flex-col gap-3">
          <TextField label="Título del paso" value={step.title} onChange={(e) => update({ title: e.target.value })} />
          <SelectField
            label="Tipo"
            value={step.type}
            options={STEP_TYPE_OPTIONS}
            onValueChange={(type) => update({ type })}
          />
          <SelectField
            label="Emoción"
            value={step.emotion}
            options={EMOTION_OPTIONS}
            onValueChange={(emotion) => update({ emotion })}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-moment"
              checked={step.momentOfTruth}
              onChange={(e) => update({ momentOfTruth: e.target.checked })}
            />
            Momento de la verdad
          </label>
          <div className="flex justify-between gap-2 border-t border-line pt-3">
            <Button
              size="sm"
              variant="danger"
              icon="trash"
              onClick={() => {
                const msg = cardCount
                  ? `¿Eliminar el paso "${step.title}" y sus ${cardCount} tarjetas?`
                  : `¿Eliminar el paso "${step.title}"?`
                if (confirm(msg)) deleteStep(project.id, map.id, step.id)
              }}
            >
              Eliminar
            </Button>
            <Button
              size="sm"
              icon="plus"
              onClick={() => {
                addStep(project.id, map.id, step.stageId, step.id)
                close()
              }}
            >
              Paso a la derecha
            </Button>
          </div>
        </div>
      )}
    </Popover>
  )
}

/** Hueco de una etapa sin pasos: permite agregar uno o soltar un paso arrastrado. */
export function EmptyStageHeader({ stage }: { stage: Stage }) {
  const { project, map } = useEditor()
  const addStep = useStudioStore((s) => s.addStep)
  const { setNodeRef, isOver } = useDroppable({
    id: `stage-empty:${stage.id}`,
    data: { type: 'stage-empty', stageId: stage.id },
  })
  return (
    <div
      ref={setNodeRef}
      className={`flex items-center justify-center border-r border-b border-line bg-surface p-2 ${isOver ? 'outline-2 -outline-offset-2 outline-primary' : ''}`}
    >
      <Button size="sm" variant="ghost" icon="plus" onClick={() => addStep(project.id, map.id, stage.id)}>
        Agregar paso
      </Button>
    </div>
  )
}
