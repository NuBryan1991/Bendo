import { useStudioStore } from '../../store/useStudioStore'
import type { Lane } from '../../types'
import { Button } from '../ui/Button'
import { TextField } from '../ui/Field'
import { Icon } from '../ui/Icon'
import { Popover } from '../ui/Popover'
import { useEditor } from './EditorContext'

/** Nombre del carril con su menú de edición (renombrar, mover, cambiar de grupo, eliminar). */
export function LaneLabel({ lane, isFirst, isLast }: { lane: Lane; isFirst: boolean; isLast: boolean }) {
  const { project, map, exporting } = useEditor()
  const renameLane = useStudioStore((s) => s.renameLane)
  const moveLane = useStudioStore((s) => s.moveLane)
  const setLaneGroup = useStudioStore((s) => s.setLaneGroup)
  const deleteLane = useStudioStore((s) => s.deleteLane)
  const setLaneOpportunity = useStudioStore((s) => s.setLaneOpportunity)
  const otherGroup = lane.group === 'frontstage' ? 'backstage' : 'frontstage'

  return (
    <div className="flex h-full items-start gap-1 px-3 py-2">
      <span className="min-w-0 flex-1 text-sm leading-snug font-semibold [overflow-wrap:anywhere]">{lane.name || 'Sin nombre'}</span>
      {!exporting && (
      <Popover
        label={`Editar carril ${lane.name}`}
        trigger={<Icon name="edit" size={14} />}
        triggerClassName="rounded p-1 text-ink-muted hover:bg-black/5 hover:text-ink"
      >
        {(close) => (
          <div className="flex flex-col gap-3">
            <TextField
              label="Nombre del carril"
              value={lane.name}
              onChange={(e) => renameLane(project.id, map.id, lane.id, e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" icon="chevronUp" disabled={isFirst} onClick={() => moveLane(project.id, map.id, lane.id, -1)}>
                Subir
              </Button>
              <Button size="sm" icon="chevronDown" disabled={isLast} onClick={() => moveLane(project.id, map.id, lane.id, 1)}>
                Bajar
              </Button>
              <Button
                size="sm"
                icon="swap"
                onClick={() => {
                  setLaneGroup(project.id, map.id, lane.id, otherGroup)
                  close()
                }}
              >
                Pasar a {otherGroup}
              </Button>
            </div>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-primary"
                checked={lane.role === 'oportunidades'}
                onChange={(e) => setLaneOpportunity(project.id, map.id, lane.id, e.target.checked)}
              />
              <span>
                Carril de oportunidades
                <span className="block text-xs text-ink-muted">Sus tarjetas se pueden conectar con el mapa futuro.</span>
              </span>
            </label>
            <div className="border-t border-line pt-3">
              <Button
                size="sm"
                variant="danger"
                icon="trash"
                onClick={() => {
                  const count = map.cards.filter((c) => c.laneId === lane.id).length
                  const msg = count
                    ? `¿Eliminar el carril "${lane.name}"? Se perderán ${count} tarjetas.`
                    : `¿Eliminar el carril "${lane.name}"?`
                  if (confirm(msg)) deleteLane(project.id, map.id, lane.id)
                }}
              >
                Eliminar carril
              </Button>
            </div>
          </div>
        )}
      </Popover>
      )}
    </div>
  )
}
