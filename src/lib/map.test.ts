import { describe, expect, it } from 'vitest'
import { buildSampleProject } from '../data/sampleProject'
import { newMap } from '../data/defaults'
import {
  cloneProject,
  gridColumns,
  opportunityCards,
  orderedSteps,
  pruneOpportunityLinks,
  solidity,
  visibleLanes,
} from './map'

describe('solidez', () => {
  it('cuenta solo frontstage en Journey y todo en Blueprint', () => {
    const map = buildSampleProject().maps[0]
    const journey = solidity(map, 'journey')
    const blueprint = solidity(map, 'blueprint')
    const front = new Set(visibleLanes(map, 'journey').map((l) => l.id))
    expect(journey.total).toBe(map.cards.filter((c) => front.has(c.laneId)).length)
    expect(blueprint.total).toBe(map.cards.length)
    expect(blueprint.research).toBe(map.cards.filter((c) => c.basis === 'investigación').length)
    expect(blueprint.percent).toBe(Math.round((blueprint.research / blueprint.total) * 100))
  })

  it('devuelve null si no hay tarjetas', () => {
    expect(solidity(newMap('Vacío'), 'blueprint').percent).toBeNull()
  })
})

describe('grilla', () => {
  it('ordena pasos por etapa y deja un hueco para etapas vacías', () => {
    const map = newMap('Prueba')
    map.steps = map.steps.filter((s) => s.stageId !== map.stages[1].id)
    const cols = gridColumns(map)
    expect(cols.map((c) => c.kind)).toEqual(['step', 'empty', 'step'])
    expect(orderedSteps(map)).toHaveLength(2)
  })
})

describe('duplicar proyecto', () => {
  it('cambia todos los ids y mantiene las relaciones (fuentes, persona, mapa base, oportunidades)', () => {
    const original = buildSampleProject()
    const copy = cloneProject(original, 'Copia')
    const [actual, future] = copy.maps
    expect(copy.id).not.toBe(original.id)
    expect(actual.id).not.toBe(original.maps[0].id)
    expect(actual.personaId).toBe(copy.personas[0].id)
    const sourceIds = new Set(copy.sources.map((s) => s.id))
    expect(actual.cards.filter((c) => c.sourceId).every((c) => sourceIds.has(c.sourceId!))).toBe(true)
    expect(future.baseMapId).toBe(actual.id)
    expect(future.opportunityLinks).toHaveLength(original.maps[1].opportunityLinks.length)
    for (const link of future.opportunityLinks) {
      expect(link.sourceMapId).toBe(actual.id)
      expect(actual.cards.some((c) => c.id === link.cardId)).toBe(true)
      expect(future.steps.some((s) => s.id === link.stepId)).toBe(true)
    }
  })
})

describe('oportunidades', () => {
  it('lista las tarjetas del carril de oportunidades en orden del recorrido', () => {
    const map = buildSampleProject().maps[0]
    const opps = opportunityCards(map)
    expect(opps.length).toBe(6)
    expect(opps.every((o) => o.lane.role === 'oportunidades')).toBe(true)
    const stepOrder = orderedSteps(map).map((s) => s.id)
    const positions = opps.map((o) => stepOrder.indexOf(o.step.id))
    expect([...positions].sort((a, b) => a - b)).toEqual(positions)
  })

  it('limpia conexiones a tarjetas o pasos que ya no existen', () => {
    const project = buildSampleProject()
    const [actual, future] = project.maps
    const link = future.opportunityLinks[0]
    actual.cards = actual.cards.filter((c) => c.id !== link.cardId)
    pruneOpportunityLinks(project)
    expect(future.opportunityLinks.some((l) => l.cardId === link.cardId)).toBe(false)
    expect(future.opportunityLinks).toHaveLength(5)
  })
})
