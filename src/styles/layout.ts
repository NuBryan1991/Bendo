/**
 * Medidas del editor que necesita el código (p. ej. para dibujar la curva emocional
 * alineada con las columnas). Los colores y la tipografía están en tokens.css.
 */
export const EMOTION_CURVE_HEIGHT = 128 // alto de la curva emocional (px)

export interface GridSizes {
  step: number // ancho de cada columna de paso (px)
  label: number // ancho de la columna con los nombres de carril (px)
  add: number // columna final "Agregar etapa" (px)
}

/** Tamaño normal (editor) y compacto (comparador, dos mapas lado a lado). */
export const GRID_SIZES: Record<'normal' | 'compact', GridSizes> = {
  normal: { step: 216, label: 184, add: 120 },
  compact: { step: 176, label: 128, add: 96 },
}
