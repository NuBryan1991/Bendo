import { useSaveStatus } from '../../store/saveStatus'
import { Icon } from './Icon'

/** Aviso global si el navegador no pudo guardar (sin espacio). */
export function SaveErrorBanner() {
  const error = useSaveStatus((s) => s.error)
  if (!error) return null
  return (
    <div role="alert" className="flex items-center gap-2 border-b border-critical bg-critical-soft px-5 py-2 text-sm text-critical">
      <Icon name="alert" />
      <span>
        <strong>No se pudo guardar.</strong> {error}
      </span>
    </div>
  )
}
