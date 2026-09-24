import { describe, expect, it } from 'vitest'
import { buildSampleProject } from '../data/sampleProject'
import { ImportError, projectsFromJSON, projectToJSON, slugify } from './projectIO'

describe('JSON', () => {
  it('exporta e importa sin perder nada (con ids nuevos)', () => {
    const original = buildSampleProject()
    const [imported] = projectsFromJSON(projectToJSON(original))
    expect(imported.id).not.toBe(original.id)
    expect(imported.name).toBe(original.name)
    expect(imported.maps).toHaveLength(2)
    expect(imported.maps[0].cards).toHaveLength(original.maps[0].cards.length)
    expect(imported.sources).toHaveLength(original.sources.length)
    expect(imported.maps[1].opportunityLinks).toHaveLength(6)
  })

  it('rechaza archivos que no son proyectos, con un mensaje claro', () => {
    expect(() => projectsFromJSON('no es json')).toThrow(ImportError)
    expect(() => projectsFromJSON('{"hola": 1}')).toThrow(/no parece un proyecto/)
    expect(() => projectsFromJSON(JSON.stringify({ version: 99, project: buildSampleProject() }))).toThrow(/más nueva/)
  })

  it('completa campos que faltan en archivos antiguos', () => {
    const old = buildSampleProject() as unknown as Record<string, unknown> & { maps: Record<string, unknown>[] }
    old.maps.forEach((m) => {
      delete m.baseMapId
      delete m.opportunityLinks
      delete m.principles
    })
    const [p] = projectsFromJSON(JSON.stringify(old))
    expect(p.maps[0].baseMapId).toBeNull()
    expect(p.maps[0].opportunityLinks).toEqual([])
    expect(p.maps[0].principles).toHaveLength(6)
  })

  it('importa una copia de seguridad completa del navegador', () => {
    const backup = { state: { projects: [buildSampleProject(), buildSampleProject()] }, version: 2 }
    expect(projectsFromJSON(JSON.stringify(backup))).toHaveLength(2)
  })

  it('genera nombres de archivo limpios', () => {
    expect(slugify('Reclamo de equipaje dañado — estado actual')).toBe('reclamo-de-equipaje-danado-estado-actual')
  })
})
