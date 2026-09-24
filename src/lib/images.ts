/**
 * Convierte una imagen subida en un data URL JPEG reducido.
 * El navegador guarda como máximo ~5 MB, así que una foto de cámara (3–8 MB) se achica
 * a un tamaño razonable antes de guardarla.
 */
export async function imageFileToDataUrl(file: File, maxSide: number, quality = 0.82): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('El archivo no es una imagen.')
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.naturalWidth * scale)
    canvas.height = Math.round(img.naturalHeight * scale)
    const ctx = canvas.getContext('2d')!
    // Fondo blanco para PNG con transparencia (JPEG no la admite).
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', quality)
  } catch {
    throw new Error('No se pudo leer la imagen.')
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** Tamaño aproximado en KB de un data URL (para mostrar cuánto ocupa). */
export function dataUrlKb(dataUrl: string): number {
  return Math.round((dataUrl.length * 3) / 4 / 1024)
}
