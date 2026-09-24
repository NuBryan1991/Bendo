/** Desplazamiento suave, salvo que el sistema pida reducir el movimiento. */
export function scrollBehavior(): ScrollBehavior {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
}
