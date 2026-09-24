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
- `npm test` — pruebas automáticas (Vitest + jsdom): reglas del store, cálculos, JSON

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
  pages/                   Home, Project, MapEditor, Compare (comparador)
  components/ui/           piezas genéricas (Button, Popover, Field…)
  components/map/          grilla, pasos, tarjetas, curva emocional, cabecera
  components/panel/        panel lateral del mapa
  components/sources/      pestaña Fuentes
  components/personas/     pestaña Personas, editor (PersonaPage) y ficha (PersonaSheet)
  components/export/       lámina imprimible (ExportSheet) y menú Exportar
  lib/exportMap.tsx        PNG/PDF (carga diferida: html-to-image + jsPDF)
  lib/projectIO.ts         exportar/importar JSON, normalización y validación
```

## Modelo de datos (resumen; ver `src/types.ts`)
- **Project**: id, name, description, maps[], personas[], sources[], createdAt, updatedAt
- **JourneyMap**: id, title, designQuestion, personaId, scenario, zoom (`end-to-end|detallado|micro`),
  state (`actual|futuro`), researchStatement, stages[], steps[], lanes[], cards[], principles[]
- **ResearchStatement**: methods, interviewCount, dateFrom, dateTo, places, triangulationNotes
- **Persona**: name, portrait, demographics, quote, contextImages[], description, needs[], motivations[],
  frustrations[], stats[{label,value}], basis, createdAt, expiresAt (12 meses por defecto)
- **JourneyMap (estado futuro)**: baseMapId (mapa actual del que partió) y opportunityLinks[]
  `{ id, sourceMapId, cardId, stepId }`: conecta una tarjeta de oportunidad del mapa actual con un paso del
  mapa futuro. Se guarda en el mapa futuro; una oportunidad → un paso por mapa futuro.
- **Stage**: id, name (por defecto Antes / Durante / Después). El orden es el del array.
- **Step**: id, stageId, title, type (`touchpoint|fuera de la organización`), momentOfTruth (boolean),
  emotion (-2..+2), order (dentro de su etapa)
- **Lane**: id, name, group (`frontstage|backstage`), role? (`oportunidades`: sus tarjetas se conectan en
  el comparador; editable desde el menú del carril). El orden es el del array.
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
- "Crear estado futuro" copia el mapa actual completo (tarjetas incluidas, con su basis), con state `futuro`,
  baseMapId apuntando al original y sin conexiones.
- Las conexiones que apuntan a tarjetas, pasos o mapas eliminados se limpian solas (`pruneOpportunityLinks`).
- Exportación PNG/PDF: se dibuja una lámina fuera de pantalla (`ExportSheet`, EditorContext con
  `exporting: true`: sin botones, asas ni textos truncados). Se prueban anchos de columna para acercarse a
  la proporción del papel (A3–A0 horizontal o ajustado al contenido), ~150 ppp, con límites de canvas.
  Se avisa de textos recortados, imágenes que no cargan (espera máx. 8 s) y hoja con mucho blanco.
- Importar JSON siempre crea un proyecto nuevo con ids nuevos; formato `{ app, version, exportedAt, project }`.
- Personas: vencida = alerta roja (mapa y persona); ≤ 30 días = aviso "vence pronto" solo en la persona.
  "Renovar" fija expiresAt = hoy + 12 meses. Eliminar una persona deja sus mapas sin actor (personaId null).
- Imágenes subidas: JPEG reducido (retrato 400 px, contexto 1000 px) guardado como data URL.
- Guardado seguro (`store/saveStatus.ts`): si localStorage se llena, se muestra un aviso global en vez de
  perder cambios en silencio.
- Guardado versionado: `persist` versión 2 con `migrate` (v1 → v2 agrega baseMapId, opportunityLinks y role).

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
- [x] 3 Pestaña Fuentes: CRUD, vínculo tarjeta↔fuente, tarjetas respaldadas por cada fuente
- [x] 4 Estado futuro + comparador lado a lado + conexión oportunidad → paso futuro
- [x] 5 Exportación: JSON (exportar/importar), PNG y PDF horizontal para imprimir en gran formato
- [x] 6 Personas: crear, editar, duplicar, eliminar, retrato/imágenes (subidas se reducen), vigencia y renovación
- [x] 7 Accesibilidad (axe sin errores en todas las pantallas, teclado, anuncios en español) y pruebas

## Accesibilidad (mantener)
- Auditoría con axe-core (WCAG 2.2 AA + buenas prácticas): 0 errores en las 10 pantallas principales.
- Enlace "Saltar al contenido" (#contenido en cada `<main>`), título de pestaña por pantalla (`usePageTitle`),
  foco al h1 al cambiar de pantalla (`RouteFocus`).
- Drag and drop: asa de teclado (Espacio + flechas) con anuncios en español (MapGrid `announcements`).
- Cada celda de la grilla es un `group` con nombre "Carril · Paso".
- Respeta `prefers-reduced-motion`. Error boundary con descarga de copia de seguridad (importable desde Inicio).
- Controles de al menos 24 px, contraste ≥ 4.5:1 (no usar opacidad para "apagar" texto).

## Forma de trabajo
- Un commit por fase. Si algo no está definido, **preguntar** en vez de inventar.
- Al cerrar una fase, explicar cómo verla en el navegador.
