import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface PopoverProps {
  /** Nombre accesible del botón que abre el menú. */
  label: string
  /** Contenido visible del botón. */
  trigger: ReactNode
  triggerClassName?: string
  width?: number
  children: (close: () => void) => ReactNode
}

/**
 * Menú flotante anclado a un botón. Se cierra con Esc o clic fuera y devuelve el foco al botón.
 * Se dibuja con position: fixed para no quedar recortado dentro de la grilla con scroll.
 */
export function Popover({ label, trigger, triggerClassName = '', width = 288, children }: PopoverProps) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => {
    setOpen(false)
    buttonRef.current?.focus()
  }, [])

  const place = useCallback(() => {
    const rect = buttonRef.current?.getBoundingClientRect()
    if (!rect) return
    const panelHeight = panelRef.current?.offsetHeight ?? 0
    const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8)
    let top = rect.bottom + 4
    if (panelHeight && top + panelHeight > window.innerHeight - 8) {
      top = Math.max(8, rect.top - panelHeight - 4)
    }
    setPos({ top, left })
  }, [width])

  useLayoutEffect(() => {
    if (open) place()
  }, [open, place])

  useEffect(() => {
    if (!open) return
    // Enfoca el primer control del panel al abrir.
    panelRef.current?.querySelector<HTMLElement>('input, textarea, select, button')?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        close()
      }
    }
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node
      if (!panelRef.current?.contains(target) && !buttonRef.current?.contains(target)) setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onPointer)
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onPointer)
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
    }
  }, [open, close, place])

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        title={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={triggerClassName}
      >
        {trigger}
      </button>
      {open &&
        createPortal(
          <div
            ref={panelRef}
            role="dialog"
            aria-label={label}
            style={{ top: pos.top, left: pos.left, width }}
            className="fixed z-50 rounded-panel border border-line-strong bg-surface p-3 text-ink shadow-lg"
          >
            {children(close)}
          </div>,
          document.body,
        )}
    </>
  )
}
