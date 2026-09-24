import { createContext, useContext } from 'react'
import type { JourneyMap, MapView, Project } from '../../types'

export interface EditorContextValue {
  project: Project
  map: JourneyMap
  view: MapView
  /** Tarjeta abierta en modo edición (solo una a la vez). */
  editingCardId: string | null
  setEditingCardId: (id: string | null) => void
  /** Grilla más estrecha (se usa en el comparador). */
  compact?: boolean
}

export const EditorContext = createContext<EditorContextValue | null>(null)

export function useEditor(): EditorContextValue {
  const ctx = useContext(EditorContext)
  if (!ctx) throw new Error('useEditor debe usarse dentro del editor de mapas')
  return ctx
}
