import { useState } from 'react'
import { PAPERS, type ExportOptions, type ExportResult, type Paper } from '../../lib/exportOptions'
import { useEditor } from '../map/EditorContext'
import { Button } from '../ui/Button'
import { Segmented, SelectField } from '../ui/Field'
import { Popover } from '../ui/Popover'

/** Menú "Exportar" del editor: PNG o PDF horizontal, listo para imprimir en gran formato. */
export function ExportMenu() {
  const { project, map, view } = useEditor()
  const [format, setFormat] = useState<ExportOptions['format']>('pdf')
  const [paper, setPaper] = useState<Paper>('A1')
  const [exportView, setExportView] = useState(view)
  const [withHeader, setWithHeader] = useState(true)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<ExportResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const run = async () => {
    setBusy(true)
    setResult(null)
    setError(null)
    try {
      // Las librerías de imagen y PDF se cargan solo al exportar.
      const { exportMap } = await import('../../lib/exportMap')
      setResult(await exportMap(project, map, { format, paper, view: exportView, withHeader }))
    } catch (e) {
      console.error(e)
      setError('No se pudo generar el archivo. Si el mapa tiene imágenes de otros sitios, prueba quitándolas.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Popover
      label="Exportar mapa"
      width={340}
      triggerClassName="inline-flex h-8 items-center gap-1.5 rounded-md border border-line-strong bg-surface px-2.5 text-sm font-medium hover:bg-surface-muted"
      trigger="Exportar"
    >
      {() => (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">Exportar para imprimir</h2>
          <Segmented
            label="Formato"
            value={format}
            onChange={setFormat}
            options={[
              { value: 'pdf', label: 'PDF' },
              { value: 'png', label: 'PNG' },
            ]}
          />
          <SelectField
            label="Tamaño de impresión"
            value={paper}
            options={PAPERS.map((p) => ({ value: p.value, label: p.label }))}
            onValueChange={setPaper}
            hint="La resolución se ajusta al tamaño elegido (unos 150 ppp)."
          />
          <Segmented
            label="Vista"
            value={exportView}
            onChange={setExportView}
            options={[
              { value: 'journey', label: 'Journey' },
              { value: 'blueprint', label: 'Blueprint' },
            ]}
          />
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-primary"
              checked={withHeader}
              onChange={(e) => setWithHeader(e.target.checked)}
            />
            <span>
              Incluir ficha del mapa
              <span className="block text-xs text-ink-muted">Título, pregunta de diseño, declaración, solidez y leyenda.</span>
            </span>
          </label>
          <Button variant="primary" onClick={run} disabled={busy}>
            {busy ? 'Generando…' : `Descargar ${format.toUpperCase()}`}
          </Button>

          <div role="status" aria-live="polite" className="text-xs">
            {result && (
              <div className="flex flex-col gap-1.5 rounded-md border border-line bg-canvas p-2.5">
                <p>
                  <strong>Listo:</strong> {result.filename}
                </p>
                <p className="text-ink-muted">
                  {result.widthPx.toLocaleString('es')} × {result.heightPx.toLocaleString('es')} px
                  {result.dpi && ` · ~${result.dpi} ppp al imprimir`}
                </p>
                {result.pageFill !== null && result.pageFill < 0.7 && (
                  <p className="text-assumption-ink">
                    El mapa ocupa solo el {Math.round(result.pageFill * 100)} % de la hoja porque es{' '}
                    {result.tooMuch === 'ancho'
                      ? 'muy largo (muchos pasos): quedará franja blanca arriba y abajo. Prueba “Ajustado al contenido” o un papel más grande.'
                      : 'más alto que ancho (muchos carriles): quedarán franjas blancas a los lados. Prueba la vista Journey o “Ajustado al contenido”.'}
                  </p>
                )}
                {result.warnings.length === 0 ? (
                  <p className="text-research-ink">No se cortó ningún texto.</p>
                ) : (
                  <ul className="list-disc pl-4 text-critical">
                    {result.warnings.map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {error && <p className="text-critical">{error}</p>}
          </div>
        </div>
      )}
    </Popover>
  )
}
