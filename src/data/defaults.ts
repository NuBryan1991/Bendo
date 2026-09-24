import { addMonths, today } from '../lib/dates'
import { newId } from '../lib/ids'
import type {
  Emotion,
  JourneyMap,
  Lane,
  LaneGroup,
  MapState,
  Persona,
  PrincipleCheck,
  PrincipleId,
  Project,
  ResearchStatement,
  Source,
  SourceType,
  Stage,
  Step,
  StepType,
  Zoom,
} from '../types'

/* ---------- Valores por defecto (todos editables desde la interfaz) ---------- */

export const DEFAULT_STAGE_NAMES = ['Antes', 'Durante', 'Después']

export const DEFAULT_LANES: { name: string; group: LaneGroup }[] = [
  { name: 'Storyboard', group: 'frontstage' },
  { name: 'Acción del cliente', group: 'frontstage' },
  { name: 'Canal', group: 'frontstage' },
  { name: 'Evidencia física', group: 'frontstage' },
  { name: 'Pensamientos y citas', group: 'frontstage' },
  { name: 'Pain points', group: 'frontstage' },
  { name: 'Oportunidades', group: 'frontstage' },
  { name: 'Comportamiento del personal', group: 'backstage' },
  { name: 'Conocimiento', group: 'backstage' },
  { name: 'Procesos', group: 'backstage' },
  { name: 'Sistemas y herramientas', group: 'backstage' },
  { name: 'Stakeholders', group: 'backstage' },
  { name: 'KPIs', group: 'backstage' },
]

/** Los 6 principios del diseño de servicios (This is Service Design Doing). */
export const PRINCIPLES: { id: PrincipleId; name: string; description: string }[] = [
  {
    id: 'centrado-en-las-personas',
    name: 'Centrado en las personas',
    description: 'Considera la experiencia de todas las personas afectadas por el servicio.',
  },
  {
    id: 'colaborativo',
    name: 'Colaborativo',
    description: 'Involucra activamente a stakeholders de distintos orígenes y funciones.',
  },
  {
    id: 'iterativo',
    name: 'Iterativo',
    description: 'Es exploratorio, adaptativo y experimental; itera hacia la implementación.',
  },
  {
    id: 'secuencial',
    name: 'Secuencial',
    description: 'Visualiza el servicio como una secuencia de acciones interrelacionadas.',
  },
  {
    id: 'real',
    name: 'Real',
    description:
      'Se basa en investigación de la realidad, prototipa en la realidad y hace visibles los valores intangibles.',
  },
  {
    id: 'holistico',
    name: 'Holístico',
    description:
      'Atiende de forma sostenible las necesidades de todos los stakeholders a lo largo del servicio y del negocio.',
  },
]

/* ---------- Etiquetas para la interfaz ---------- */

export const ZOOM_OPTIONS: { value: Zoom; label: string }[] = [
  { value: 'end-to-end', label: 'End-to-end' },
  { value: 'detallado', label: 'Detallado' },
  { value: 'micro', label: 'Micro' },
]

export const STATE_OPTIONS: { value: MapState; label: string }[] = [
  { value: 'actual', label: 'Estado actual' },
  { value: 'futuro', label: 'Estado futuro' },
]

export const STEP_TYPE_OPTIONS: { value: StepType; label: string }[] = [
  { value: 'touchpoint', label: 'Touchpoint' },
  { value: 'fuera de la organización', label: 'Fuera de la organización' },
]

export const EMOTION_OPTIONS: { value: Emotion; label: string }[] = [
  { value: 2, label: '+2 · Muy positiva' },
  { value: 1, label: '+1 · Positiva' },
  { value: 0, label: '0 · Neutral' },
  { value: -1, label: '−1 · Negativa' },
  { value: -2, label: '−2 · Muy negativa' },
]

export const SOURCE_TYPE_OPTIONS: { value: SourceType; label: string }[] = [
  { value: 'entrevista', label: 'Entrevista' },
  { value: 'observación', label: 'Observación' },
  { value: 'encuesta', label: 'Encuesta' },
  { value: 'analítica', label: 'Analítica' },
  { value: 'documento', label: 'Documento' },
]

/* ---------- Fábricas de objetos nuevos ---------- */

export function emptyResearchStatement(): ResearchStatement {
  return {
    methods: '',
    interviewCount: null,
    dateFrom: '',
    dateTo: '',
    places: '',
    triangulationNotes: '',
  }
}

export function defaultPrinciples(): PrincipleCheck[] {
  return PRINCIPLES.map((p) => ({ id: p.id, checked: false, note: '' }))
}

export function defaultLanes(): Lane[] {
  return DEFAULT_LANES.map((l) => ({ id: newId(), ...l }))
}

export function defaultStages(): Stage[] {
  return DEFAULT_STAGE_NAMES.map((name) => ({ id: newId(), name }))
}

export function newStep(stageId: string, order: number, title = 'Nuevo paso'): Step {
  return {
    id: newId(),
    stageId,
    title,
    type: 'touchpoint',
    momentOfTruth: false,
    emotion: 0,
    order,
  }
}

export function newMap(title: string, personaId: string | null = null): JourneyMap {
  const stages = defaultStages()
  return {
    id: newId(),
    title,
    designQuestion: '',
    personaId,
    scenario: '',
    zoom: 'end-to-end',
    state: 'actual',
    researchStatement: emptyResearchStatement(),
    stages,
    steps: stages.map((s) => newStep(s.id, 0)),
    lanes: defaultLanes(),
    cards: [],
    principles: defaultPrinciples(),
  }
}

export function newProject(name: string, description = ''): Project {
  const now = today()
  return {
    id: newId(),
    name,
    description,
    maps: [],
    personas: [],
    sources: [],
    createdAt: now,
    updatedAt: now,
  }
}

export function newPersona(name: string): Persona {
  const created = today()
  return {
    id: newId(),
    name,
    portrait: '',
    demographics: '',
    quote: '',
    contextImages: [],
    description: '',
    needs: [],
    motivations: [],
    frustrations: [],
    stats: [],
    basis: 'supuesto',
    createdAt: created,
    expiresAt: addMonths(created, 12),
  }
}

export function newSource(): Source {
  return { id: newId(), type: 'entrevista', date: today(), participant: '', note: '', link: '' }
}
