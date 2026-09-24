import { toPng } from 'html-to-image'
import { jsPDF } from 'jspdf'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { ExportSheet } from '../components/export/ExportSheet'
import type { JourneyMap, Project } from '../types'
import { PAPERS, type ExportOptions, type ExportResult } from './exportOptions'
import { today } from './dates'
import { downloadFile, slugify } from './projectIO'

const MARGIN_MM = 10
const TARGET_DPI = 150 // suficiente para ver de cerca un póster; más aumenta mucho el peso
const CSS_PX_PER_MM = 96 / 25.4
const MAX_SIDE_PX = 16000 // límites de canvas de los navegadores
const MAX_AREA_PX = 120_000_000
const STEP_WIDTHS = [184, 216, 248, 280, 320, 360, 400]
const EMPTY_PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='

/**
 * Dibuja el mapa completo fuera de la pantalla, lo convierte en imagen y lo descarga como PNG o PDF.
 * Elige el ancho de las columnas para que la lámina se acerque a la proporción horizontal del papel.
 */
export async function exportMap(project: Project, map: JourneyMap, options: ExportOptions): Promise<ExportResult> {
  const paper = PAPERS.find((p) => p.value === options.paper)!
  // Proporción objetivo: la del área útil del papel; sin papel, la de la serie A (√2).
  const targetAspect = paper.mm ? (paper.mm[0] - 2 * MARGIN_MM) / (paper.mm[1] - 2 * MARGIN_MM) : Math.SQRT2

  const host = document.createElement('div')
  host.style.cssText = 'position:fixed;left:-100000px;top:0;pointer-events:none;'
  document.body.appendChild(host)
  const root = createRoot(host)

  try {
    const render = (stepWidth: number) => {
      flushSync(() =>
        root.render(
          <ExportSheet
            project={project}
            map={map}
            view={options.view}
            withHeader={options.withHeader}
            stepWidth={stepWidth}
          />,
        ),
      )
      return host.firstElementChild as HTMLElement
    }

    // 1. Ancho de columna que deja la lámina más cerca de la proporción del papel.
    let best = { stepWidth: STEP_WIDTHS[0], score: Infinity }
    for (const stepWidth of STEP_WIDTHS) {
      const el = render(stepWidth)
      const score = Math.abs(Math.log(el.offsetWidth / el.offsetHeight / targetAspect))
      if (score < best.score - 0.01) best = { stepWidth, score }
    }
    const sheet = render(best.stepWidth)
    await document.fonts.ready
    const warnings = await settleImages(sheet)
    warnings.push(...findClipping(sheet))
    const width = sheet.offsetWidth
    const height = sheet.offsetHeight

    // 2. Resolución: ~150 ppp en el papel elegido, dentro de los límites del navegador.
    const pageMm = paper.mm ?? [width / CSS_PX_PER_MM + 2 * MARGIN_MM, height / CSS_PX_PER_MM + 2 * MARGIN_MM]
    const mmPerCssPx = Math.min((pageMm[0] - 2 * MARGIN_MM) / width, (pageMm[1] - 2 * MARGIN_MM) / height)
    const wanted = paper.mm ? (mmPerCssPx * TARGET_DPI) / 25.4 : 3
    const pixelRatio = Math.max(
      1,
      Math.min(wanted, MAX_SIDE_PX / Math.max(width, height), Math.sqrt(MAX_AREA_PX / (width * height))),
    )

    const dataUrl = await toPng(sheet, {
      pixelRatio,
      backgroundColor: '#ffffff',
      imagePlaceholder: EMPTY_PIXEL,
      cacheBust: true,
    })

    const base = `${slugify(map.title)}-${options.view}-${today()}`
    const imgW = width * mmPerCssPx
    const imgH = height * mmPerCssPx
    const dpi = Math.round((pixelRatio / mmPerCssPx) * 25.4)

    if (options.format === 'png') {
      const filename = `${base}.png`
      downloadFile(await (await fetch(dataUrl)).blob(), filename)
      return {
        filename,
        widthPx: Math.round(width * pixelRatio),
        heightPx: Math.round(height * pixelRatio),
        dpi: paper.mm ? dpi : null,
        pageFill: null,
        tooMuch: null,
        warnings,
      }
    }

    // 3. PDF horizontal con la imagen centrada.
    const [pw, ph] = pageMm
    const pdf = new jsPDF({ orientation: pw >= ph ? 'landscape' : 'portrait', unit: 'mm', format: [pw, ph], compress: true })
    pdf.setProperties({ title: map.title, subject: project.name, creator: 'Journey Map Studio' })
    pdf.addImage(dataUrl, 'PNG', (pw - imgW) / 2, (ph - imgH) / 2, imgW, imgH, undefined, 'FAST')
    const filename = `${base}-${options.paper}.pdf`
    downloadFile(pdf.output('blob'), filename, 'application/pdf')
    return {
      filename,
      widthPx: Math.round(width * pixelRatio),
      heightPx: Math.round(height * pixelRatio),
      dpi,
      pageFill: (imgW * imgH) / ((pw - 2 * MARGIN_MM) * (ph - 2 * MARGIN_MM)),
      tooMuch: width / height > targetAspect ? 'ancho' : 'alto',
      warnings,
    }
  } finally {
    root.unmount()
    host.remove()
  }
}

/** Busca textos recortados (contenido más grande que su caja) e imágenes que no cargaron. */
function findClipping(sheet: HTMLElement): string[] {
  const warnings: string[] = []
  sheet.querySelectorAll<HTMLElement>('*').forEach((el) => {
    if (el instanceof SVGElement || el.closest('svg')) return
    const style = getComputedStyle(el)
    const clips = style.overflowX !== 'visible' || style.overflowY !== 'visible' || style.textOverflow === 'ellipsis'
    const overflowing = el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1
    if (clips && overflowing && el.textContent?.trim()) {
      warnings.push(`Texto cortado: “${el.textContent.trim().slice(0, 80)}”`)
    }
  })
  return warnings
}

const IMAGE_TIMEOUT_MS = 8000

/**
 * Espera a que carguen las imágenes (como máximo unos segundos). Las que no cargan se reemplazan
 * por un píxel vacío: así un enlace roto o la falta de internet nunca bloquean la exportación.
 */
async function settleImages(sheet: HTMLElement): Promise<string[]> {
  const warnings: string[] = []
  await Promise.all(
    [...sheet.querySelectorAll('img')].map(async (img) => {
      const loaded = await Promise.race([
        img.decode().then(
          () => img.naturalWidth > 0,
          () => false,
        ),
        new Promise<boolean>((resolve) => setTimeout(() => resolve(false), IMAGE_TIMEOUT_MS)),
      ])
      if (!loaded) {
        warnings.push(`No se pudo incluir la imagen ${img.src.slice(0, 80)}`)
        img.src = EMPTY_PIXEL
        img.style.display = 'none'
      }
    }),
  )
  return warnings
}
