import { create } from 'zustand'

/**
 * Estado del guardado en el navegador. Si localStorage se llena (típicamente por imágenes),
 * el guardado falla: aquí se registra para mostrar un aviso en lugar de perder cambios en silencio.
 */
interface SaveStatus {
  error: string | null
  /** Tamaño aproximado de lo guardado, en bytes. */
  bytes: number
  setError: (error: string | null) => void
  setBytes: (bytes: number) => void
}

export const useSaveStatus = create<SaveStatus>()((set) => ({
  error: null,
  bytes: 0,
  setError: (error) => set({ error }),
  setBytes: (bytes) => set({ bytes }),
}))

/** Capacidad típica de localStorage en los navegadores (unos 5 MB). */
export const STORAGE_LIMIT_BYTES = 5 * 1024 * 1024

/** localStorage que no rompe la app cuando se queda sin espacio. */
export const safeLocalStorage = {
  getItem: (name: string) => {
    const value = localStorage.getItem(name)
    // Cada carácter ocupa ~2 bytes en localStorage.
    if (value) useSaveStatus.getState().setBytes(value.length * 2)
    return value
  },
  setItem: (name: string, value: string) => {
    try {
      localStorage.setItem(name, value)
      useSaveStatus.getState().setBytes(value.length * 2)
      if (useSaveStatus.getState().error) useSaveStatus.getState().setError(null)
    } catch {
      useSaveStatus
        .getState()
        .setError(
          'El navegador se quedó sin espacio y los últimos cambios no se guardaron. Quita o achica imágenes, o exporta el proyecto a JSON.',
        )
    }
  },
  removeItem: (name: string) => localStorage.removeItem(name),
}
