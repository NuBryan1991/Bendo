/**
 * Modelo de datos de Journey Map Studio.
 * Los valores de los tipos enumerados están en español porque se muestran tal cual en la interfaz.
 * Las fechas se guardan como texto ISO 'AAAA-MM-DD'.
 */

export type ID = string
export type ISODate = string

/** De dónde viene un dato: una suposición del equipo o evidencia de investigación. */
export type Basis = 'supuesto' | 'investigación'
/** Dato crudo (cita, observación literal) o interpretado (conclusión, insight). */
export type DataType = 'crudo' | 'interpretado'

export type Zoom = 'end-to-end' | 'detallado' | 'micro'
export type MapState = 'actual' | 'futuro'
export type StepType = 'touchpoint' | 'fuera de la organización'
export type Emotion = -2 | -1 | 0 | 1 | 2
export type LaneGroup = 'frontstage' | 'backstage'
export type SourceType = 'entrevista' | 'observación' | 'encuesta' | 'analítica' | 'documento'
export type MapView = 'journey' | 'blueprint'

export type PrincipleId =
  | 'centrado-en-las-personas'
  | 'colaborativo'
  | 'iterativo'
  | 'secuencial'
  | 'real'
  | 'holistico'

export interface Project {
  id: ID
  name: string
  description: string
  maps: JourneyMap[]
  personas: Persona[]
  sources: Source[]
  createdAt: ISODate
  updatedAt: ISODate
}

export interface JourneyMap {
  id: ID
  title: string
  designQuestion: string
  /** Actor principal del mapa. */
  personaId: ID | null
  scenario: string
  zoom: Zoom
  state: MapState
  researchStatement: ResearchStatement
  stages: Stage[]
  steps: Step[]
  lanes: Lane[]
  cards: Card[]
  principles: PrincipleCheck[]
}

export interface ResearchStatement {
  methods: string
  interviewCount: number | null
  dateFrom: ISODate | ''
  dateTo: ISODate | ''
  places: string
  triangulationNotes: string
}

export interface PrincipleCheck {
  id: PrincipleId
  checked: boolean
  /** Justificación breve de por qué se cumple (o no). */
  note: string
}

export interface PersonaStat {
  label: string
  value: string
}

export interface Persona {
  id: ID
  name: string
  /** URL o imagen en formato data URL. */
  portrait: string
  demographics: string
  quote: string
  contextImages: string[]
  description: string
  needs: string[]
  motivations: string[]
  frustrations: string[]
  stats: PersonaStat[]
  basis: Basis
  createdAt: ISODate
  /** Por defecto, 12 meses después de createdAt. */
  expiresAt: ISODate
}

/** Etapa del recorrido. El orden es el del array `map.stages`. */
export interface Stage {
  id: ID
  name: string
}

/** Paso = una columna de la grilla. */
export interface Step {
  id: ID
  stageId: ID
  title: string
  type: StepType
  /** Momento de la verdad: se puede combinar con cualquier tipo. */
  momentOfTruth: boolean
  emotion: Emotion
  /** Posición dentro de su etapa. */
  order: number
}

/** Carril = una fila de la grilla. El orden es el del array `map.lanes`. */
export interface Lane {
  id: ID
  name: string
  group: LaneGroup
}

export interface Card {
  id: ID
  stepId: ID
  laneId: ID
  text: string
  basis: Basis
  dataType: DataType
  sourceId?: ID
  /** Imagen opcional (útil en el carril Storyboard). */
  imageUrl?: string
  /** Posición dentro de su celda (paso × carril). */
  order: number
}

export interface Source {
  id: ID
  type: SourceType
  date: ISODate | ''
  participant: string
  note: string
  link: string
}
