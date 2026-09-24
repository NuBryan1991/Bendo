import { current } from 'immer'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { newMap, newProject, newSource, newStep } from '../data/defaults'
import { buildSampleProject } from '../data/sampleProject'
import { today } from '../lib/dates'
import { newId } from '../lib/ids'
import { cloneMap, cloneProject, stepsOfStage } from '../lib/map'
import type {
  Card,
  JourneyMap,
  Lane,
  LaneGroup,
  MapView,
  PrincipleCheck,
  PrincipleId,
  Project,
  ResearchStatement,
  Source,
  Stage,
  Step,
} from '../types'

type MapPatch = Partial<
  Pick<JourneyMap, 'title' | 'designQuestion' | 'personaId' | 'scenario' | 'zoom' | 'state'>
>
type CardPatch = Partial<Pick<Card, 'text' | 'basis' | 'dataType' | 'sourceId' | 'imageUrl'>>

interface StudioState {
  projects: Project[]
  /** Vista elegida en cada mapa (preferencia de interfaz, no forma parte del proyecto). */
  mapViews: Record<string, MapView>

  // Proyectos
  createProject: (name: string, description?: string) => string
  updateProject: (projectId: string, patch: Partial<Pick<Project, 'name' | 'description'>>) => void
  duplicateProject: (projectId: string) => string | undefined
  deleteProject: (projectId: string) => void
  addSampleProject: () => string

  // Mapas
  createMap: (projectId: string, title: string) => string | undefined
  duplicateMap: (projectId: string, mapId: string) => string | undefined
  deleteMap: (projectId: string, mapId: string) => void
  updateMap: (projectId: string, mapId: string, patch: MapPatch) => void
  updateResearch: (projectId: string, mapId: string, patch: Partial<ResearchStatement>) => void
  updatePrinciple: (
    projectId: string,
    mapId: string,
    principleId: PrincipleId,
    patch: Partial<Omit<PrincipleCheck, 'id'>>,
  ) => void
  setMapView: (mapId: string, view: MapView) => void

  // Etapas
  addStage: (projectId: string, mapId: string) => void
  renameStage: (projectId: string, mapId: string, stageId: string, name: string) => void
  moveStage: (projectId: string, mapId: string, stageId: string, delta: -1 | 1) => void
  deleteStage: (projectId: string, mapId: string, stageId: string) => void

  // Pasos
  addStep: (projectId: string, mapId: string, stageId: string, afterStepId?: string) => string | undefined
  updateStep: (
    projectId: string,
    mapId: string,
    stepId: string,
    patch: Partial<Omit<Step, 'id' | 'stageId' | 'order'>>,
  ) => void
  moveStep: (projectId: string, mapId: string, stepId: string, toStageId: string, toIndex: number) => void
  deleteStep: (projectId: string, mapId: string, stepId: string) => void

  // Carriles
  addLane: (projectId: string, mapId: string, group: LaneGroup) => void
  renameLane: (projectId: string, mapId: string, laneId: string, name: string) => void
  moveLane: (projectId: string, mapId: string, laneId: string, delta: -1 | 1) => void
  setLaneGroup: (projectId: string, mapId: string, laneId: string, group: LaneGroup) => void
  deleteLane: (projectId: string, mapId: string, laneId: string) => void

  // Tarjetas
  addCard: (projectId: string, mapId: string, stepId: string, laneId: string) => string | undefined
  updateCard: (projectId: string, mapId: string, cardId: string, patch: CardPatch) => void
  moveCard: (
    projectId: string,
    mapId: string,
    cardId: string,
    toStepId: string,
    toLaneId: string,
    toIndex: number,
  ) => void
  deleteCard: (projectId: string, mapId: string, cardId: string) => void

  // Fuentes
  addSource: (projectId: string, data?: Partial<Omit<Source, 'id'>>) => string | undefined
  updateSource: (projectId: string, sourceId: string, patch: Partial<Omit<Source, 'id'>>) => void
  deleteSource: (projectId: string, sourceId: string) => void
}

/* ---------- Ayudantes internos (trabajan sobre el borrador de immer) ---------- */

function findProject(state: StudioState, projectId: string): Project | undefined {
  const project = state.projects.find((p) => p.id === projectId)
  if (project) project.updatedAt = today()
  return project
}

function findMap(state: StudioState, projectId: string, mapId: string): JourneyMap | undefined {
  return findProject(state, projectId)?.maps.find((m) => m.id === mapId)
}

/** Vuelve a numerar 0, 1, 2… el orden de los pasos de una etapa. */
function renumberSteps(map: JourneyMap, stageId: string) {
  stepsOfStage(map, stageId).forEach((s, i) => (s.order = i))
}

function renumberCell(map: JourneyMap, stepId: string, laneId: string) {
  map.cards
    .filter((c) => c.stepId === stepId && c.laneId === laneId)
    .sort((a, b) => a.order - b.order)
    .forEach((c, i) => (c.order = i))
}

function moveInArray<T>(list: T[], index: number, delta: number) {
  const target = index + delta
  if (index < 0 || target < 0 || target >= list.length) return
  const [item] = list.splice(index, 1)
  list.splice(target, 0, item)
}

/**
 * Regla de evidencia: una tarjeta con fuente vinculada siempre es "investigación".
 * Se aplica en cualquier cambio de tarjeta.
 */
function applyEvidenceRule(card: Card) {
  if (card.sourceId) card.basis = 'investigación'
}

/* ---------- Store ---------- */

export const useStudioStore = create<StudioState>()(
  persist(
    immer((set) => ({
      projects: [buildSampleProject()],
      mapViews: {},

      /* Proyectos */
      createProject: (name, description = '') => {
        const project = newProject(name, description)
        set((s) => {
          s.projects.unshift(project)
        })
        return project.id
      },
      updateProject: (projectId, patch) =>
        set((s) => {
          const p = findProject(s, projectId)
          if (p) Object.assign(p, patch)
        }),
      duplicateProject: (projectId) => {
        let id: string | undefined
        set((s) => {
          const index = s.projects.findIndex((p) => p.id === projectId)
          if (index < 0) return
          const original = s.projects[index]
          // current() convierte el borrador de immer en un objeto normal que se puede copiar.
          const copy = cloneProject(current(original), `${original.name} (copia)`)
          copy.createdAt = copy.updatedAt = today()
          s.projects.splice(index + 1, 0, copy)
          id = copy.id
        })
        return id
      },
      deleteProject: (projectId) =>
        set((s) => {
          s.projects = s.projects.filter((p) => p.id !== projectId)
        }),
      addSampleProject: () => {
        const project = buildSampleProject()
        set((s) => {
          s.projects.unshift(project)
        })
        return project.id
      },

      /* Mapas */
      createMap: (projectId, title) => {
        let id: string | undefined
        set((s) => {
          const p = findProject(s, projectId)
          if (!p) return
          const map = newMap(title, p.personas[0]?.id ?? null)
          p.maps.push(map)
          id = map.id
        })
        return id
      },
      duplicateMap: (projectId, mapId) => {
        let id: string | undefined
        set((s) => {
          const p = findProject(s, projectId)
          const index = p?.maps.findIndex((m) => m.id === mapId) ?? -1
          if (!p || index < 0) return
          const copy = cloneMap(current(p.maps[index]))
          copy.title = `${copy.title} (copia)`
          p.maps.splice(index + 1, 0, copy)
          id = copy.id
        })
        return id
      },
      deleteMap: (projectId, mapId) =>
        set((s) => {
          const p = findProject(s, projectId)
          if (p) p.maps = p.maps.filter((m) => m.id !== mapId)
          delete s.mapViews[mapId]
        }),
      updateMap: (projectId, mapId, patch) =>
        set((s) => {
          const m = findMap(s, projectId, mapId)
          if (m) Object.assign(m, patch)
        }),
      updateResearch: (projectId, mapId, patch) =>
        set((s) => {
          const m = findMap(s, projectId, mapId)
          if (m) Object.assign(m.researchStatement, patch)
        }),
      updatePrinciple: (projectId, mapId, principleId, patch) =>
        set((s) => {
          const m = findMap(s, projectId, mapId)
          const pr = m?.principles.find((x) => x.id === principleId)
          if (pr) Object.assign(pr, patch)
        }),
      setMapView: (mapId, view) =>
        set((s) => {
          s.mapViews[mapId] = view
        }),

      /* Etapas */
      addStage: (projectId, mapId) =>
        set((s) => {
          const m = findMap(s, projectId, mapId)
          if (!m) return
          const stage: Stage = { id: newId(), name: 'Nueva etapa' }
          m.stages.push(stage)
          m.steps.push(newStep(stage.id, 0))
        }),
      renameStage: (projectId, mapId, stageId, name) =>
        set((s) => {
          const stage = findMap(s, projectId, mapId)?.stages.find((x) => x.id === stageId)
          if (stage) stage.name = name
        }),
      moveStage: (projectId, mapId, stageId, delta) =>
        set((s) => {
          const m = findMap(s, projectId, mapId)
          if (m) moveInArray(m.stages, m.stages.findIndex((x) => x.id === stageId), delta)
        }),
      deleteStage: (projectId, mapId, stageId) =>
        set((s) => {
          const m = findMap(s, projectId, mapId)
          if (!m || m.stages.length <= 1) return
          const stepIds = new Set(m.steps.filter((x) => x.stageId === stageId).map((x) => x.id))
          m.stages = m.stages.filter((x) => x.id !== stageId)
          m.steps = m.steps.filter((x) => !stepIds.has(x.id))
          m.cards = m.cards.filter((c) => !stepIds.has(c.stepId))
        }),

      /* Pasos */
      addStep: (projectId, mapId, stageId, afterStepId) => {
        let id: string | undefined
        set((s) => {
          const m = findMap(s, projectId, mapId)
          if (!m) return
          const siblings = stepsOfStage(m, stageId)
          const after = siblings.find((x) => x.id === afterStepId)
          const order = after ? after.order + 0.5 : siblings.length
          const step = newStep(stageId, order)
          m.steps.push(step)
          renumberSteps(m, stageId)
          id = step.id
        })
        return id
      },
      updateStep: (projectId, mapId, stepId, patch) =>
        set((s) => {
          const step = findMap(s, projectId, mapId)?.steps.find((x) => x.id === stepId)
          if (step) Object.assign(step, patch)
        }),
      moveStep: (projectId, mapId, stepId, toStageId, toIndex) =>
        set((s) => {
          const m = findMap(s, projectId, mapId)
          const step = m?.steps.find((x) => x.id === stepId)
          if (!m || !step) return
          const fromStageId = step.stageId
          const targets = stepsOfStage(m, toStageId).filter((x) => x.id !== stepId)
          targets.splice(Math.max(0, Math.min(toIndex, targets.length)), 0, step)
          step.stageId = toStageId
          targets.forEach((x, i) => (x.order = i))
          if (fromStageId !== toStageId) renumberSteps(m, fromStageId)
        }),
      deleteStep: (projectId, mapId, stepId) =>
        set((s) => {
          const m = findMap(s, projectId, mapId)
          const step = m?.steps.find((x) => x.id === stepId)
          if (!m || !step) return
          m.steps = m.steps.filter((x) => x.id !== stepId)
          m.cards = m.cards.filter((c) => c.stepId !== stepId)
          renumberSteps(m, step.stageId)
        }),

      /* Carriles */
      addLane: (projectId, mapId, group) =>
        set((s) => {
          const m = findMap(s, projectId, mapId)
          if (!m) return
          const lane: Lane = { id: newId(), name: 'Nuevo carril', group }
          // Se inserta al final de su grupo para mantener frontstage arriba y backstage abajo.
          const lastIndex = m.lanes.map((l) => l.group).lastIndexOf(group)
          m.lanes.splice(lastIndex + 1, 0, lane)
        }),
      renameLane: (projectId, mapId, laneId, name) =>
        set((s) => {
          const lane = findMap(s, projectId, mapId)?.lanes.find((l) => l.id === laneId)
          if (lane) lane.name = name
        }),
      moveLane: (projectId, mapId, laneId, delta) =>
        set((s) => {
          const m = findMap(s, projectId, mapId)
          if (!m) return
          const index = m.lanes.findIndex((l) => l.id === laneId)
          const target = m.lanes[index + delta]
          // Solo se reordena dentro del mismo grupo.
          if (target && target.group === m.lanes[index].group) moveInArray(m.lanes, index, delta)
        }),
      setLaneGroup: (projectId, mapId, laneId, group) =>
        set((s) => {
          const m = findMap(s, projectId, mapId)
          const index = m?.lanes.findIndex((l) => l.id === laneId) ?? -1
          if (!m || index < 0) return
          const [lane] = m.lanes.splice(index, 1)
          lane.group = group
          if (group === 'frontstage') {
            // Pasa al final del frontstage (justo encima de la línea de visibilidad).
            const lastFront = m.lanes.map((l) => l.group).lastIndexOf('frontstage')
            m.lanes.splice(lastFront + 1, 0, lane)
          } else {
            // Pasa al inicio del backstage (justo debajo de la línea de visibilidad).
            const firstBack = m.lanes.findIndex((l) => l.group === 'backstage')
            m.lanes.splice(firstBack < 0 ? m.lanes.length : firstBack, 0, lane)
          }
        }),
      deleteLane: (projectId, mapId, laneId) =>
        set((s) => {
          const m = findMap(s, projectId, mapId)
          if (!m) return
          m.lanes = m.lanes.filter((l) => l.id !== laneId)
          m.cards = m.cards.filter((c) => c.laneId !== laneId)
        }),

      /* Tarjetas */
      addCard: (projectId, mapId, stepId, laneId) => {
        let id: string | undefined
        set((s) => {
          const m = findMap(s, projectId, mapId)
          if (!m) return
          const order = m.cards.filter((c) => c.stepId === stepId && c.laneId === laneId).length
          const card: Card = {
            id: newId(),
            stepId,
            laneId,
            text: '',
            basis: 'supuesto',
            dataType: 'interpretado',
            order,
          }
          m.cards.push(card)
          id = card.id
        })
        return id
      },
      updateCard: (projectId, mapId, cardId, patch) =>
        set((s) => {
          const card = findMap(s, projectId, mapId)?.cards.find((c) => c.id === cardId)
          if (!card) return
          Object.assign(card, patch)
          if (!card.sourceId) delete card.sourceId
          applyEvidenceRule(card)
        }),
      moveCard: (projectId, mapId, cardId, toStepId, toLaneId, toIndex) =>
        set((s) => {
          const m = findMap(s, projectId, mapId)
          const card = m?.cards.find((c) => c.id === cardId)
          if (!m || !card) return
          const from = { stepId: card.stepId, laneId: card.laneId }
          const targets = m.cards
            .filter((c) => c.stepId === toStepId && c.laneId === toLaneId && c.id !== cardId)
            .sort((a, b) => a.order - b.order)
          targets.splice(Math.max(0, Math.min(toIndex, targets.length)), 0, card)
          card.stepId = toStepId
          card.laneId = toLaneId
          targets.forEach((c, i) => (c.order = i))
          renumberCell(m, from.stepId, from.laneId)
        }),
      deleteCard: (projectId, mapId, cardId) =>
        set((s) => {
          const m = findMap(s, projectId, mapId)
          const card = m?.cards.find((c) => c.id === cardId)
          if (!m || !card) return
          m.cards = m.cards.filter((c) => c.id !== cardId)
          renumberCell(m, card.stepId, card.laneId)
        }),

      /* Fuentes */
      addSource: (projectId, data) => {
        let id: string | undefined
        set((s) => {
          const p = findProject(s, projectId)
          if (!p) return
          const source = { ...newSource(), ...data }
          p.sources.unshift(source)
          id = source.id
        })
        return id
      },
      updateSource: (projectId, sourceId, patch) =>
        set((s) => {
          const source = findProject(s, projectId)?.sources.find((x) => x.id === sourceId)
          if (source) Object.assign(source, patch)
        }),
      deleteSource: (projectId, sourceId) =>
        set((s) => {
          const p = findProject(s, projectId)
          if (!p) return
          p.sources = p.sources.filter((x) => x.id !== sourceId)
          // Las tarjetas que la citaban quedan sin fuente (conservan su basis).
          p.maps.forEach((m) =>
            m.cards.forEach((c) => {
              if (c.sourceId === sourceId) delete c.sourceId
            }),
          )
        }),
    })),
    {
      name: 'journey-map-studio',
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
