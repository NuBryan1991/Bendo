# Journey Map Studio — contexto para Claude

## Producto
Herramienta web **local** para crear y alimentar journey maps y service blueprints con el enfoque de
*This is Service Design Doing* (Stickdorn, Lawrence, Hormess, Schneider).
La usuaria/el usuario es product designer senior, **no programa**: explica todo en lenguaje simple y en español.

Idea central: la investigación se carga poco a poco, y **cada mapa debe mostrar con claridad qué está
basado en investigación y qué es solo un supuesto**.

## Stack
- React + TypeScript + Vite
- Tailwind v4 (`@tailwindcss/vite`). Design tokens en `src/styles/tokens.css` (bloque `@theme`).
  Medidas del editor que también usa el código en `src/styles/layout.ts`.
- Estado: Zustand + `persist` (localStorage, clave `journey-map-studio`) + `immer`.
- Drag and drop: dnd-kit (`@dnd-kit/core`, `@dnd-kit/sortable`).
- Rutas: `react-router-dom` con `HashRouter` (funciona sin servidor y en GitHub Pages).
- Sin backend ni login.

## Comandos
- `npm install` — instala dependencias (una vez)
- `npm run dev` — abre la app en http://localhost:5173
- `npm run build` — verifica tipos y genera `dist/`
- `npm run lint` — oxlint

## Estructura
```
src/
  types.ts                 modelo de datos (fuente de verdad)
  styles/tokens.css        design tokens (colores, tipografía, radios)
  styles/layout.ts         medidas del editor usadas en TS (ancho de paso, etc.)
  store/useStudioStore.ts  estado global + acciones + guardado
  data/defaults.ts         etapas, carriles, principios y fábricas de objetos vacíos
  data/sampleProject.ts    proyecto de ejemplo (equipaje dañado)
  lib/                     cálculos puros (solidez, fechas, ids, orden)
  pages/                   Home, Project, MapEditor
  components/ui/           piezas genéricas (Button, Popover, Field…)
  components/map/          grilla, pasos, tarjetas, curva emocional, cabecera
  components/panel/        panel lateral del mapa
  components/sources/      pestaña Fuentes
```

## Modelo de datos (resumen; ver `src/types.ts`)
- **Project**: id, name, description, maps[], personas[], sources[], createdAt, updatedAt
- **JourneyMap**: id, title, designQuestion, personaId, scenario, zoom (`end-to-end|detallado|micro`),
  state (`actual|futuro`), researchStatement, stages[], steps[], lanes[], cards[], principles[]
- **ResearchStatement**: methods, interviewCount, dateFrom, dateTo, places, triangulationNotes
- **Persona**: name, portrait, demographics, quote, contextImages[], description, needs[], motivations[],
  frustrations[], stats[{label,value}], basis, createdAt, expiresAt (12 meses por defecto)
- **Stage**: id, name (por defecto Antes / Durante / Después). El orden es el del array.
- **Step**: id, stageId, title, type (`touchpoint|fuera de la organización`), momentOfTruth (boolean),
  emotion (-2..+2), order (dentro de su etapa)
- **Lane**: id, name, group (`frontstage|backstage`). El orden es el del array.
  Frontstage por defecto: Storyboard, Acción del cliente, Canal, Evidencia física, Pensamientos y citas,
  Pain points, Oportunidades. Backstage: Comportamiento del personal, Conocimiento, Procesos,
  Sistemas y herramientas, Stakeholders, KPIs.
- **Card**: id, stepId, laneId, text, basis (`supuesto|investigación`), dataType (`crudo|interpretado`),
  sourceId?, imageUrl?, order (dentro de su celda)
- **Source**: id, type (`entrevista|observación|encuesta|analítica|documento`), date, participant, note, link
- **PrincipleCheck**: id, checked, note — los 6 principios: centrado en las personas, colaborativo,
  iterativo, secuencial, real, holístico.

Decisiones tomadas (confirmadas por defecto con el usuario):
- "Momento de la verdad" es una marca aparte (`momentOfTruth`) combinable con el tipo de paso.
- Las tarjetas viven en `map.cards`.
- **Si una tarjeta tiene `sourceId`, su basis es siempre `investigación`** (se fuerza en el store).
  Quitar la fuente no revierte la basis automáticamente.
- Solidez = % de tarjetas con basis investigación **en la vista activa** (Journey = solo frontstage).
- La vista (journey/blueprint) se recuerda por mapa (`mapViews` en el store, no en los datos del proyecto).

## Reglas de UX (no romper)
- Tarjeta **supuesto**: borde punteado + color de advertencia (`assumption`). **Investigación**: borde sólido (`research`).
- Indicador de solidez en la cabecera del mapa.
- Aviso si la persona del mapa venció (`expiresAt` < hoy).
- Pasos con momento de la verdad y puntos con emoción -2 se resaltan (grilla y curva).
- Todo es editable desde la interfaz; nada de contenido fijo en el código (solo valores por defecto).
- Interfaz en español, sobria, contraste WCAG AA, foco visible, operable con teclado
  (drag and drop con asa + teclado; menús con Esc para cerrar).

## Fases
- [x] 0 Base: Vite, Tailwind, tokens, CLAUDE.md
- [x] 1 MVP: modelo, guardado, Inicio, Proyecto (Mapas), editor de grilla, curva emocional, datos de ejemplo
- [x] 2 Vista Blueprint + línea de visibilidad + carriles editables + panel lateral (ficha, declaración, principios)
- [ ] 3 Pestaña Fuentes: CRUD, vínculo tarjeta↔fuente, tarjetas respaldadas por cada fuente
- [ ] 4 Personas (CRUD, caducidad)
- [ ] 5 Comparador actual/futuro
- [ ] 6 Exportación JSON / PNG / PDF
- [ ] 7 Pulido de accesibilidad y pruebas

## Forma de trabajo
- Un commit por fase. Si algo no está definido, **preguntar** en vez de inventar.
- Al cerrar una fase, explicar cómo verla en el navegador.
