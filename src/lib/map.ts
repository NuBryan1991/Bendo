import { formatDate } from './dates'
import { newId } from './ids'
import type { Card, JourneyMap, Lane, MapView, Project, Source, Stage, Step } from '../types'

/** Columna de la grilla: un paso, o un hueco para una etapa que aún no tiene pasos. */
export type GridColumn =
  | { kind: 'step'; step: Step; stage: Stage }
  | { kind: 'empty'; stage: Stage }

/** Pasos ordenados por etapa y luego por su orden dentro de la etapa. */
export function orderedSteps(map: JourneyMap): Step[] {
  return map.stages.flatMap((stage) => stepsOfStage(map, stage.id))
}

export function stepsOfStage(map: JourneyMap, stageId: string): Step[] {
  return map.steps.filter((s) => s.stageId === stageId).sort((a, b) => a.order - b.order)
}

export function gridColumns(map: JourneyMap): GridColumn[] {
  return map.stages.flatMap((stage): GridColumn[] => {
    const steps = stepsOfStage(map, stage.id)
    return steps.length
      ? steps.map((step) => ({ kind: 'step', step, stage }))
      : [{ kind: 'empty', stage }]
  })
}

export function cardsInCell(map: JourneyMap, stepId: string, laneId: string): Card[] {
  return map.cards
    .filter((c) => c.stepId === stepId && c.laneId === laneId)
    .sort((a, b) => a.order - b.order)
}

/** Carriles que se ven en cada vista: Journey = solo frontstage. */
export function visibleLanes(map: JourneyMap, view: MapView): Lane[] {
  return view === 'journey' ? map.lanes.filter((l) => l.group === 'frontstage') : map.lanes
}

export interface Solidity {
  research: number
  total: number
  /** 0–100, o null si no hay tarjetas. */
  percent: number | null
}

/** Solidez: qué parte de las tarjetas visibles está basada en investigación. */
export function solidity(map: JourneyMap, view: MapView): Solidity {
  const laneIds = new Set(visibleLanes(map, view).map((l) => l.id))
  const cards = map.cards.filter((c) => laneIds.has(c.laneId))
  const research = cards.filter((c) => c.basis === 'investigación').length
  return {
    research,
    total: cards.length,
    percent: cards.length ? Math.round((research / cards.length) * 100) : null,
  }
}

const SOURCE_TYPE_LABEL: Record<Source['type'], string> = {
  entrevista: 'Entrevista',
  observación: 'Observación',
  encuesta: 'Encuesta',
  analítica: 'Analítica',
  documento: 'Documento',
}

export function sourceTypeLabel(type: Source['type']): string {
  return SOURCE_TYPE_LABEL[type]
}

/** Nombre corto de una fuente: "Entrevista · P1 Camila · 12 mar 2026". */
export function sourceLabel(source: Source): string {
  return [sourceTypeLabel(source.type), source.participant, formatDate(source.date)]
    .filter(Boolean)
    .join(' · ')
}

/* ---------- Copias con identificadores nuevos (para duplicar) ---------- */

/**
 * Copia un mapa entero dándole ids nuevos a todo lo interno y manteniendo las relaciones.
 * `idMap` guarda las equivalencias viejo → nuevo; al copiar un proyecto se comparte entre
 * todos sus mapas para que las referencias entre mapas (mapa base, oportunidades) sigan valiendo.
 */
export function cloneMap(map: JourneyMap, idMap: Map<string, string> = new Map()): JourneyMap {
  const remap = (id: string) => {
    if (!idMap.has(id)) idMap.set(id, newId())
    return idMap.get(id)!
  }
  /** Solo cambia la referencia si el objeto apuntado también se copió. */
  const follow = (id: string) => idMap.get(id) ?? id
  const copy = structuredClone(map)
  copy.id = remap(map.id)
  copy.stages.forEach((s) => (s.id = remap(s.id)))
  copy.lanes.forEach((l) => (l.id = remap(l.id)))
  copy.steps.forEach((s) => {
    s.id = remap(s.id)
    s.stageId = remap(s.stageId)
  })
  copy.cards.forEach((c) => {
    c.id = remap(c.id)
    c.stepId = remap(c.stepId)
    c.laneId = remap(c.laneId)
    // Personas y fuentes solo se remapean si se está copiando el proyecto entero.
    if (c.sourceId) c.sourceId = follow(c.sourceId)
  })
  if (copy.personaId) copy.personaId = follow(copy.personaId)
  return copy
}

/** Tras copiar mapas, ajusta las referencias entre mapas (mapa base y oportunidades). */
function relinkMap(copy: JourneyMap, idMap: Map<string, string>) {
  const follow = (id: string) => idMap.get(id) ?? id
  if (copy.baseMapId) copy.baseMapId = follow(copy.baseMapId)
  copy.opportunityLinks = copy.opportunityLinks.map((l) => ({
    id: newId(),
    sourceMapId: follow(l.sourceMapId),
    cardId: follow(l.cardId),
    stepId: follow(l.stepId),
  }))
}

/** Copia un solo mapa dentro del mismo proyecto. */
export function duplicateMapData(map: JourneyMap): JourneyMap {
  const idMap = new Map<string, string>()
  const copy = cloneMap(map, idMap)
  relinkMap(copy, idMap)
  return copy
}

export function cloneProject(project: Project, name: string): Project {
  const idMap = new Map<string, string>()
  const copy = structuredClone(project)
  copy.id = newId()
  copy.name = name
  copy.personas.forEach((p) => {
    const id = newId()
    idMap.set(p.id, id)
    p.id = id
  })
  copy.sources.forEach((s) => {
    const id = newId()
    idMap.set(s.id, id)
    s.id = id
  })
  copy.maps = project.maps.map((m) => cloneMap(m, idMap))
  copy.maps.forEach((m) => relinkMap(m, idMap))
  return copy
}

/* ---------- Estado actual ↔ estado futuro ---------- */

export function isOpportunityLane(lane: Lane | undefined): boolean {
  return lane?.role === 'oportunidades'
}

/** Tarjetas de los carriles de oportunidades, en el orden del recorrido. */
export function opportunityCards(map: JourneyMap): { card: Card; step: Step; lane: Lane }[] {
  const lanes = map.lanes.filter(isOpportunityLane)
  return orderedSteps(map).flatMap((step) =>
    lanes.flatMap((lane) => cardsInCell(map, step.id, lane.id).map((card) => ({ card, step, lane }))),
  )
}

/** Mapa futuro sugerido para comparar con un mapa actual (el primero creado a partir de él). */
export function futureMapFor(project: Project, actualMapId: string): JourneyMap | undefined {
  return (
    project.maps.find((m) => m.state === 'futuro' && m.baseMapId === actualMapId) ??
    project.maps.find((m) => m.opportunityLinks.some((l) => l.sourceMapId === actualMapId))
  )
}

/** Pasos futuros (en cualquier mapa) conectados con una tarjeta de oportunidad. */
export function futureStepsForCard(project: Project, cardId: string): { map: JourneyMap; step: Step }[] {
  return project.maps.flatMap((map) =>
    map.opportunityLinks
      .filter((l) => l.cardId === cardId)
      .flatMap((l) => {
        const step = map.steps.find((s) => s.id === l.stepId)
        return step ? [{ map, step }] : []
      }),
  )
}

/** Oportunidades (de cualquier mapa actual) a las que responde un paso de un mapa futuro. */
export function opportunitiesForStep(project: Project, map: JourneyMap, stepId: string): Card[] {
  return map.opportunityLinks
    .filter((l) => l.stepId === stepId)
    .flatMap((l) => {
      const card = project.maps.find((m) => m.id === l.sourceMapId)?.cards.find((c) => c.id === l.cardId)
      return card ? [card] : []
    })
}

/** Quita conexiones que apuntan a mapas, tarjetas o pasos que ya no existen. */
export function pruneOpportunityLinks(project: Project) {
  const cards = new Map(project.maps.map((m) => [m.id, new Set(m.cards.map((c) => c.id))]))
  project.maps.forEach((m) => {
    const steps = new Set(m.steps.map((s) => s.id))
    m.opportunityLinks = m.opportunityLinks.filter(
      (l) => steps.has(l.stepId) && cards.get(l.sourceMapId)?.has(l.cardId),
    )
    if (m.baseMapId && !cards.has(m.baseMapId)) m.baseMapId = null
  })
}

/* ---------- Fuentes ↔ tarjetas ---------- */

export interface SourceBacklink {
  map: JourneyMap
  card: Card
  step?: Step
  lane?: Lane
}

/** Todas las tarjetas del proyecto que citan una fuente, agrupables por mapa. */
export function cardsBySource(project: Project, sourceId: string): SourceBacklink[] {
  return project.maps.flatMap((map) => {
    const steps = orderedSteps(map)
    return map.cards
      .filter((c) => c.sourceId === sourceId)
      .map((card) => ({
        map,
        card,
        step: steps.find((s) => s.id === card.stepId),
        lane: map.lanes.find((l) => l.id === card.laneId),
      }))
      .sort(
        (a, b) =>
          steps.indexOf(a.step!) - steps.indexOf(b.step!) ||
          map.lanes.indexOf(a.lane!) - map.lanes.indexOf(b.lane!),
      )
  })
}
