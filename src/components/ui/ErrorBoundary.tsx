import { Component, type ErrorInfo, type ReactNode } from 'react'

/**
 * Red de seguridad: si algo falla al dibujar una pantalla, en vez de una página en blanco
 * se muestra un mensaje y la opción de descargar una copia de todos los datos.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack)
  }

  private downloadBackup = () => {
    const raw = localStorage.getItem('journey-map-studio') ?? '{}'
    const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `journey-map-studio-copia-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <main id="contenido" className="mx-auto max-w-xl p-10">
        <div role="alert" className="rounded-panel border-2 border-critical bg-surface p-6">
          <h1 className="text-xl font-semibold">Algo salió mal al mostrar esta pantalla</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Tus datos siguen guardados en este navegador. Por seguridad, descarga una copia antes de seguir.
          </p>
          <p className="mt-2 text-xs text-ink-muted">Detalle técnico: {this.state.error.message}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={this.downloadBackup}
              className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
            >
              Descargar copia de mis datos
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.hash = '#/'
                window.location.reload()
              }}
              className="h-10 rounded-md border border-line-strong px-4 text-sm font-medium hover:bg-surface-muted"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </main>
    )
  }
}
