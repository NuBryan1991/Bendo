import {
  closestCenter,
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { horizontalListSortingStrategy, SortableContext, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { Fragment, useState } from 'react'
import { cardsInCell, gridColumns, stepsOfStage, visibleLanes } from '../../lib/map'
import { useStudioStore } from '../../store/useStudioStore'
import { ADD_COLUMN_WIDTH, LANE_LABEL_WIDTH, STEP_WIDTH } from '../../styles/layout'
import type { Lane, LaneGroup } from '../../types'
import { Button } from '../ui/Button'
import { CardView } from './CardItem'
import { cardSurface } from './cardStyles'
import { useEditor } from './EditorContext'
import { EmotionCurve, EmotionScale } from './EmotionCurve'
import { EmptyCell, GridCell } from './GridCell'
import { LaneLabel } from './LaneLabel'
import { StageHeader } from './StageHeader'
import { EmptyStageHeader, StepHeader, StepHeaderContent } from './StepHeader'
import { VisibilityLine } from './VisibilityLine'

type DragData =
  | { type: 'step'; stepId: string; stageId: string }
  | { type: 'stage-empty'; stageId: string }
  | { type: 'card'; cardId: string; stepId: string; laneId: string }
  | { type: 'cell'; stepId: string; laneId: string }

/**
 * Colisiones según lo que se arrastra: un paso solo cae sobre pasos (o etapas vacías);
 * una tarjeta solo cae sobre tarjetas o celdas.
 */
const collisionDetection: CollisionDetection = (args) => {
  const activeType = (args.active.data.current as DragData | undefined)?.type
  const allowed = activeType === 'step' ? ['step', 'stage-empty'] : ['card', 'cell']
  const droppableContainers = args.droppableContainers.filter((c) =>
    allowed.includes((c.data.current as DragData | undefined)?.type ?? ''),
  )
  const scoped = { ...args, droppableContainers }
  if (activeType === 'step') return closestCenter(scoped)
  // Con el puntero: preferimos la tarjeta bajo el cursor; si no hay, la celda.
  const hits = pointerWithin(scoped)
  if (hits.length) {
    const cardHit = hits.find((h) => (h.data?.droppableContainer.data.current as DragData)?.type === 'card')
    return [cardHit ?? hits[0]]
  }
  // Sin puntero (teclado): se excluye la celda propia para que las flechas salgan de ella.
  const active = args.active.data.current as DragData
  const outsideOwnCell = droppableContainers.filter((c) => {
    const d = c.data.current as DragData
    return !(active.type === 'card' && d.type === 'cell' && d.stepId === active.stepId && d.laneId === active.laneId)
  })
  return closestCorners({ ...args, droppableContainers: outsideOwnCell })
}

const LABEL_CELL = 'sticky left-0 z-[2] border-r border-b border-line bg-surface'

export function MapGrid() {
  const { project, map, view } = useEditor()
  const moveStep = useStudioStore((s) => s.moveStep)
  const moveCard = useStudioStore((s) => s.moveCard)
  const addStage = useStudioStore((s) => s.addStage)
  const [active, setActive] = useState<DragData | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const columns = gridColumns(map)
  const lanes = visibleLanes(map, view)
  const frontstage = lanes.filter((l) => l.group === 'frontstage')
  const backstage = lanes.filter((l) => l.group === 'backstage')
  const stepIds = columns.flatMap((c) => (c.kind === 'step' ? [`step:${c.step.id}`] : []))
  const template = `${LANE_LABEL_WIDTH}px repeat(${columns.length}, ${STEP_WIDTH}px) ${ADD_COLUMN_WIDTH}px`
  const fullRow = { gridColumn: `1 / span ${columns.length + 2}` }

  const onDragStart = (e: DragStartEvent) => setActive((e.active.data.current as DragData) ?? null)

  const onDragEnd = ({ active: a, over }: DragEndEvent) => {
    setActive(null)
    const from = a.data.current as DragData | undefined
    const to = over?.data.current as DragData | undefined
    if (!from || !to || a.id === over?.id) return

    if (from.type === 'step') {
      if (to.type === 'stage-empty') moveStep(project.id, map.id, from.stepId, to.stageId, 0)
      if (to.type === 'step') {
        const index = stepsOfStage(map, to.stageId).findIndex((s) => s.id === to.stepId)
        moveStep(project.id, map.id, from.stepId, to.stageId, index)
      }
    }
    if (from.type === 'card') {
      if (to.type === 'cell') moveCard(project.id, map.id, from.cardId, to.stepId, to.laneId, Infinity)
      if (to.type === 'card') {
        const index = cardsInCell(map, to.stepId, to.laneId).findIndex((c) => c.id === to.cardId)
        moveCard(project.id, map.id, from.cardId, to.stepId, to.laneId, index)
      }
    }
  }

  const laneRows = (group: Lane[]) =>
    group.map((lane, i) => (
      <Fragment key={lane.id}>
        <div className={`${LABEL_CELL} ${lane.group === 'backstage' ? 'bg-surface-muted' : ''}`}>
          <LaneLabel lane={lane} isFirst={i === 0} isLast={i === group.length - 1} />
        </div>
        {columns.map((col) =>
          col.kind === 'step' ? (
            <GridCell key={col.step.id} step={col.step} lane={lane} />
          ) : (
            <EmptyCell key={col.stage.id} backstage={lane.group === 'backstage'} />
          ),
        )}
        <div className="border-b border-line" />
      </Fragment>
    ))

  const groupHeader = (group: LaneGroup, label: string) => (
    <div style={fullRow} className="border-b border-line bg-canvas">
      <div className="sticky left-0 inline-flex items-center gap-3 px-3 py-1.5">
        <span className="text-xs font-bold tracking-wider text-ink-muted uppercase">{label}</span>
        <LaneAddButton group={group} />
      </div>
    </div>
  )

  const activeCard = active?.type === 'card' ? map.cards.find((c) => c.id === active.cardId) : undefined
  const activeStep = active?.type === 'step' ? map.steps.find((s) => s.id === active.stepId) : undefined

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActive(null)}
      accessibility={{ screenReaderInstructions: { draggable: 'Pulsa Espacio para tomar el elemento, usa las flechas para moverlo, Espacio para soltarlo o Esc para cancelar.' } }}
    >
      <div className="grid w-max border-t border-l border-line" style={{ gridTemplateColumns: template }}>
        {/* Fila 1: etapas */}
        <div className={`${LABEL_CELL} flex items-center px-3 text-xs font-semibold text-ink-muted`}>Etapas</div>
        {map.stages.map((stage, i) => (
          <StageHeader
            key={stage.id}
            stage={stage}
            index={i}
            span={Math.max(1, columns.filter((c) => c.stage.id === stage.id).length)}
          />
        ))}
        <div className="flex items-center border-b border-line px-2">
          <Button size="sm" variant="ghost" icon="plus" onClick={() => addStage(project.id, map.id)}>
            Etapa
          </Button>
        </div>

        {/* Fila 2: pasos */}
        <div className={`${LABEL_CELL} flex items-center px-3 text-xs font-semibold text-ink-muted`}>Pasos</div>
        <SortableContext items={stepIds} strategy={horizontalListSortingStrategy}>
          {columns.map((col) =>
            col.kind === 'step' ? (
              <StepHeader key={col.step.id} step={col.step} />
            ) : (
              <EmptyStageHeader key={col.stage.id} stage={col.stage} />
            ),
          )}
        </SortableContext>
        <div className="border-b border-line" />

        {/* Fila 3: curva emocional */}
        <div className={`${LABEL_CELL} px-3 pt-2 text-xs font-semibold text-ink-muted`}>
          <span className="relative z-[1]">Curva emocional</span>
          <EmotionScale />
        </div>
        <div style={{ gridColumn: `span ${columns.length}` }} className="border-r border-b border-line bg-surface">
          <EmotionCurve columns={columns} />
        </div>
        <div className="border-b border-line" />

        {/* Carriles */}
        {groupHeader('frontstage', 'Frontstage')}
        {laneRows(frontstage)}

        {view === 'blueprint' && (
          <>
            <VisibilityLine style={fullRow} />
            {groupHeader('backstage', 'Backstage')}
            {laneRows(backstage)}
          </>
        )}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeCard && (
          <div className={`w-[200px] rounded-card shadow-lg ${cardSurface(activeCard)}`}>
            <CardView card={activeCard} />
          </div>
        )}
        {activeStep && (
          <div className="w-[216px] rounded border border-line-strong bg-surface shadow-lg">
            <StepHeaderContent step={activeStep} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

function LaneAddButton({ group }: { group: LaneGroup }) {
  const { project, map } = useEditor()
  const addLane = useStudioStore((s) => s.addLane)
  return (
    <Button size="sm" variant="ghost" icon="plus" onClick={() => addLane(project.id, map.id, group)}>
      Carril
    </Button>
  )
}
