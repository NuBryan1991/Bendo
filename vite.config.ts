import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Rutas relativas: la app funciona igual en local o publicada en una subcarpeta.
  base: './',
  plugins: [react(), tailwindcss()],
})
