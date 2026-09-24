import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

/** Enlace "Saltar al contenido": visible solo al recibir foco con el teclado. */
export function SkipLink() {
  return (
    <a
      href="#contenido"
      onClick={(e) => {
        // Con HashRouter, un href con # cambiaría de pantalla: se mueve el foco a mano.
        e.preventDefault()
        document.getElementById('contenido')?.focus()
      }}
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-white"
    >
      Saltar al contenido
    </a>
  )
}

/**
 * Al cambiar de pantalla, lleva el foco al título principal (h1). Así quien navega con teclado
 * o lector de pantalla empieza desde arriba y sabe dónde está.
 */
export function RouteFocus() {
  const { pathname } = useLocation()
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    const h1 = document.querySelector<HTMLElement>('h1')
    if (!h1) return
    h1.setAttribute('tabindex', '-1')
    h1.dataset.routeFocus = ''
    h1.focus()
  }, [pathname])
  return null
}
