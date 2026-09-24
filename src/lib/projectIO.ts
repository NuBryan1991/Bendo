import { defaultPrinciples, emptyResearchStatement } from '../data/defaults'
import type { JourneyMap, Project } from '../types'
import { today } from './dates'
import { cloneProject } from './map'

/** Versión del formato de archivo. Coincide con la versión del guardado local. */
export const FILE_VERSION = 2

interface ProjectFile {
  app: 'journey-map-studio'
  version: number
  exportedAt: string
  project: Project
}

/* ---------- Exportar ---------- */

export function projectToJSON(project: Project): string {
  const file: ProjectFile = {
    app: 'journey-map-studio',
    version: FILE_VERSION,
    exportedAt: new Date().toISOString(),
    project,
  }
  return JSON.stringify(file, null, 2)
}

/** "Reclamo de equipaje — estado actual" → "reclamo-de-equipaje-estado-actual" */
export function slugify(text: string): string {
  return (
    text
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'journey-map'
  )
}

/** Descarga un archivo en el navegador. */
export function downloadFile(content: Blob | string, filename: string, type = 'application/json') {
  const blob = typeof content === 'string' ? new Blob([content], { type }) : content
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/* ---------- Importar ---------- */

export class ImportError extends Error {}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null
const isArray = Array.isArray

/**
 * Lee un archivo exportado (o un proyecto suelto), valida lo esencial y completa los campos
 * que falten con valores por defecto. Devuelve una copia con ids nuevos, para que importar
 * dos veces el mismo archivo no choque con el proyecto original.
 */
export function projectFromJSON(text: string): Project {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new ImportError('El archivo no es un JSON válido.')
  }
  const raw = isObject(data) && isObject(data.project) ? data.project : data
  if (isObject(data) && typeof data.version === 'number' && data.version > FILE_VERSION) {
    throw new ImportError('El archivo viene de una versión más nueva de Journey Map Studio.')
  }
  const project = normalizeProject(raw)
  return cloneProject(project, project.name)
}

/** Completa y valida un proyecto (también se usa al migrar el guardado local). */
export function normalizeProject(raw: unknown): Project {
  if (!isObject(raw) || typeof raw.name !== 'string' || !isArray(raw.maps)) {
    throw new ImportError('El archivo no parece un proyecto de Journey Map Studio (falta el nombre o los mapas).')
  }
  const p = raw as unknown as Project
  p.description ??= ''
  p.personas = isArray(p.personas) ? p.personas : []
  p.sources = isArray(p.sources) ? p.sources : []
  p.createdAt ??= today()
  p.updatedAt ??= today()
  p.maps.forEach((m, i) => normalizeMap(m, i))
  return p
}

function normalizeMap(m: JourneyMap, index: number) {
  if (!isObject(m) || !isArray(m.stages) || !isArray(m.steps) || !isArray(m.lanes) || !isArray(m.cards)) {
    throw new ImportError(`El mapa ${index + 1} está incompleto (faltan etapas, pasos, carriles o tarjetas).`)
  }
  m.title ??= 'Mapa sin título'
  m.designQuestion ??= ''
  m.personaId ??= null
  m.scenario ??= ''
  m.zoom ??= 'end-to-end'
  m.state ??= 'actual'
  m.researchStatement = { ...emptyResearchStatement(), ...(m.researchStatement ?? {}) }
  const principles = isArray(m.principles) ? m.principles : []
  m.principles = defaultPrinciples().map((d) => principles.find((p) => p.id === d.id) ?? d)
  m.baseMapId ??= null
  m.opportunityLinks = isArray(m.opportunityLinks) ? m.opportunityLinks : []
  m.lanes.forEach((l) => {
    if (!l.role && l.name?.trim().toLowerCase() === 'oportunidades') l.role = 'oportunidades'
  })
  m.cards.forEach((c, i) => {
    c.order ??= i
    c.basis ??= 'supuesto'
    c.dataType ??= 'interpretado'
    c.text ??= ''
    if (c.sourceId) c.basis = 'investigación'
  })
  m.steps.forEach((s, i) => {
    s.order ??= i
    s.emotion ??= 0
    s.type ??= 'touchpoint'
    s.momentOfTruth ??= false
  })
}
