import { beforeEach, describe, expect, it } from 'vitest'
import { buildSampleProject } from '../data/sampleProject'
import { cardsInCell, stepsOfStage } from '../lib/map'
import { useStudioStore } from './useStudioStore'

const store = () => useStudioStore.getState()
const project = () => store().projects[0]
const actual = () => project().maps[0]

beforeEach(() => {
  localStorage.clear()
  useStudioStore.setState({ projects: [buildSampleProject()], mapViews: {} })
})

describe('regla de evidencia', () => {
  it('una tarjeta con fuente pasa sola a investigación y no puede volver a supuesto', () => {
    const card = actual().cards.find((c) => c.basis === 'supuesto')!
    const source = project().sources[0]
    store().updateCard(project().id, actual().id, card.id, { sourceId: source.id })
    let updated = actual().cards.find((c) => c.id === card.id)!
    expect(updated.basis).toBe('investigación')
    store().updateCard(project().id, actual().id, card.id, { basis: 'supuesto' })
    updated = actual().cards.find((c) => c.id === card.id)!
    expect(updated.basis).toBe('investigación')
  })

  it('al quitar la fuente la tarjeta conserva su basis', () => {
    const card = actual().cards.find((c) => c.sourceId)!
    store().updateCard(project().id, actual().id, card.id, { sourceId: undefined })
    const updated = actual().cards.find((c) => c.id === card.id)!
    expect(updated.sourceId).toBeUndefined()
    expect(updated.basis).toBe('investigación')
  })

  it('eliminar una fuente desvincula sus tarjetas', () => {
    const source = project().sources[0]
    store().deleteSource(project().id, source.id)
    expect(project().maps.flatMap((m) => m.cards).some((c) => c.sourceId === source.id)).toBe(false)
  })
})

describe('mover pasos y tarjetas', () => {
  it('mueve un paso a otra etapa y renumera ambas', () => {
    const [antes, durante] = actual().stages
    const step = stepsOfStage(actual(), antes.id)[0]
    store().moveStep(project().id, actual().id, step.id, durante.id, 0)
    expect(stepsOfStage(actual(), durante.id)[0].id).toBe(step.id)
    expect(stepsOfStage(actual(), antes.id).map((s) => s.order)).toEqual([0])
    expect(stepsOfStage(actual(), durante.id).map((s) => s.order)).toEqual([0, 1, 2, 3, 4])
  })

  it('mueve una tarjeta a otra celda en la posición indicada', () => {
    const card = actual().cards[0]
    const target = actual().cards.find((c) => c.stepId !== card.stepId)!
    store().moveCard(project().id, actual().id, card.id, target.stepId, target.laneId, 0)
    const cell = cardsInCell(actual(), target.stepId, target.laneId)
    expect(cell[0].id).toBe(card.id)
    expect(cell.map((c) => c.order)).toEqual(cell.map((_, i) => i))
  })

  it('eliminar un paso elimina sus tarjetas', () => {
    const step = actual().steps[0]
    store().deleteStep(project().id, actual().id, step.id)
    expect(actual().cards.some((c) => c.stepId === step.id)).toBe(false)
  })
})

describe('estado futuro', () => {
  it('crea un mapa futuro vinculado, sin conexiones', () => {
    const id = store().createFutureMap(project().id, actual().id)!
    const future = project().maps.find((m) => m.id === id)!
    expect(future.state).toBe('futuro')
    expect(future.baseMapId).toBe(actual().id)
    expect(future.title).toMatch(/estado futuro/)
    expect(future.opportunityLinks).toEqual([])
    expect(future.cards).toHaveLength(actual().cards.length)
  })

  it('una oportunidad se conecta con un solo paso por mapa futuro', () => {
    const future = project().maps[1]
    const link = future.opportunityLinks[0]
    const otherStep = future.steps.find((s) => s.id !== link.stepId)!
    store().setOpportunityLink(project().id, future.id, actual().id, link.cardId, otherStep.id)
    const links = project().maps[1].opportunityLinks.filter((l) => l.cardId === link.cardId)
    expect(links).toHaveLength(1)
    expect(links[0].stepId).toBe(otherStep.id)
    store().setOpportunityLink(project().id, future.id, actual().id, link.cardId, null)
    expect(project().maps[1].opportunityLinks.some((l) => l.cardId === link.cardId)).toBe(false)
  })

  it('borrar una oportunidad borra su conexión', () => {
    const link = project().maps[1].opportunityLinks[0]
    store().deleteCard(project().id, actual().id, link.cardId)
    expect(project().maps[1].opportunityLinks.some((l) => l.cardId === link.cardId)).toBe(false)
  })
})

describe('personas', () => {
  it('eliminar una persona deja sus mapas sin actor', () => {
    const persona = project().personas[0]
    store().deletePersona(project().id, persona.id)
    expect(project().maps.every((m) => m.personaId === null)).toBe(true)
  })

  it('una persona nueva vence a los 12 meses', () => {
    const id = store().addPersona(project().id)!
    const persona = project().personas.find((p) => p.id === id)!
    const created = new Date(persona.createdAt)
    const expires = new Date(persona.expiresAt)
    expect(expires.getFullYear() - created.getFullYear()).toBe(1)
    expect(persona.basis).toBe('supuesto')
  })
})

describe('proyectos', () => {
  it('duplicar un proyecto crea una copia independiente', () => {
    const id = store().duplicateProject(project().id)!
    const copy = store().projects.find((p) => p.id === id)!
    expect(copy.name).toMatch(/\(copia\)/)
    store().updateCard(copy.id, copy.maps[0].id, copy.maps[0].cards[0].id, { text: 'cambiado' })
    expect(project().maps[0].cards[0].text).not.toBe('cambiado')
  })
})
