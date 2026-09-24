import { useEffect } from 'react'

/** Título de la pestaña del navegador (también lo anuncian los lectores de pantalla). */
export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} · Journey Map Studio` : 'Journey Map Studio'
  }, [title])
}
