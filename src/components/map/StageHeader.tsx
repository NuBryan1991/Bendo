import { useStudioStore } from '../../store/useStudioStore'
import type { Stage } from '../../types'
import { Button } from '../ui/Button'
import { TextField } from '../ui/Field'
import { Icon } from '../ui/Icon'
import { Popover } from '../ui/Popover'
import { useEditor } from './EditorContext'

export function StageHeader({ stage, span, index }: { stage: Stage; span: number; index: number }) {
  const { project, map, exporting } = useEditor()
  const renameStage = useStudioStore((s) => s.renameStage)
  const moveStage = useStudioStore((s) => s.moveStage)
  const deleteStage = useStudioStore((s) => s.deleteStage)
  const addStep = useStudioStore((s) => s.addStep)
  const isFirst = index === 0
  const isLast = index === map.stages.length - 1

  return (
    <div
      style={{ gridColumn: `span ${span}` }}
      className="flex items-center gap-2 border-r-2 border-b border-r-line-strong border-b-line bg-ink px-3 py-2 text-white"
    >
      <h2 className={`min-w-0 flex-1 text-sm font-semibold tracking-wide uppercase ${exporting ? '' : 'truncate'}`}>{stage.name || 'Sin nombre'}</h2>
      {!exporting && (
      <Popover
        label={`Editar etapa ${stage.name}`}
        trigger={<Icon name="edit" size={14} />}
        triggerClassName="rounded p-1 text-white/80 hover:bg-white/15 hover:text-white"
      >
        {(close) => (
          <div className="flex flex-col gap-3">
            <TextField
              label="Nombre de la etapa"
              value={stage.name}
              onChange={(e) => renameStage(project.id, map.id, stage.id, e.target.value)}
            />
            <div className="flex gap-2">
              <Button size="sm" icon="chevronLeft" disabled={isFirst} onClick={() => moveStage(project.id, map.id, stage.id, -1)}>
                Mover
              </Button>
              <Button size="sm" icon="chevronRight" disabled={isLast} onClick={() => moveStage(project.id, map.id, stage.id, 1)}>
                Mover
              </Button>
            </div>
            <div className="flex justify-between gap-2 border-t border-line pt-3">
              <Button
                size="sm"
                variant="danger"
                icon="trash"
                disabled={map.stages.length <= 1}
                title={map.stages.length <= 1 ? 'El mapa necesita al menos una etapa' : undefined}
                onClick={() => {
                  const stepCount = map.steps.filter((s) => s.stageId === stage.id).length
                  if (confirm(`¿Eliminar la etapa "${stage.name}" con sus ${stepCount} pasos y sus tarjetas?`)) {
                    deleteStage(project.id, map.id, stage.id)
                    close()
                  }
                }}
              >
                Eliminar
              </Button>
              <Button
                size="sm"
                icon="plus"
                onClick={() => {
                  addStep(project.id, map.id, stage.id)
                  close()
                }}
              >
                Agregar paso
              </Button>
            </div>
          </div>
        )}
      </Popover>
      )}
    </div>
  )
}
