import type { MapView } from '../types'

/* Opciones de exportación. Separadas de exportMap para no cargar las librerías de imagen/PDF hasta usarlas. */

export type Paper = 'contenido' | 'A3' | 'A2' | 'A1' | 'A0'

/** Tamaños de papel en horizontal (ancho × alto, mm). */
export const PAPERS: { value: Paper; label: string; mm: [number, number] | null }[] = [
  { value: 'contenido', label: 'Ajustado al contenido (una página)', mm: null },
  { value: 'A3', label: 'A3 horizontal (42 × 29,7 cm)', mm: [420, 297] },
  { value: 'A2', label: 'A2 horizontal (59,4 × 42 cm)', mm: [594, 420] },
  { value: 'A1', label: 'A1 horizontal (84,1 × 59,4 cm)', mm: [841, 594] },
  { value: 'A0', label: 'A0 horizontal (118,9 × 84,1 cm)', mm: [1189, 841] },
]

export interface ExportOptions {
  format: 'png' | 'pdf'
  paper: Paper
  view: MapView
  withHeader: boolean
}

export interface ExportResult {
  filename: string
  widthPx: number
  heightPx: number
  /** Resolución de impresión estimada en el papel elegido. */
  dpi: number | null
  /** Qué parte de la hoja ocupa el mapa (0–1), para avisar si queda mucho blanco. */
  pageFill: number | null
  /** Si sobra hoja: 'alto' = el mapa es más alto que la hoja; 'ancho' = más ancho. */
  tooMuch: 'alto' | 'ancho' | null
  /** Textos que quedaron cortados o imágenes que no se pudieron incluir. */
  warnings: string[]
}
