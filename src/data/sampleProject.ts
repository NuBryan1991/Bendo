import { newId } from '../lib/ids'
import type {
  Basis,
  Card,
  DataType,
  Emotion,
  JourneyMap,
  Persona,
  Project,
  Source,
  Stage,
  Step,
  StepType,
} from '../types'
import { defaultLanes, defaultPrinciples } from './defaults'

/**
 * Proyecto de ejemplo: reclamar equipaje dañado en una aerolínea (ficticia).
 * Mezcla a propósito tarjetas de supuesto e investigación para mostrar cómo se ve cada una.
 * Todas las tarjetas de investigación citan una fuente.
 */
export function buildSampleProject(): Project {
  /* Fuentes */
  const src = {
    p1: source('entrevista', '2026-03-10', 'P1 · Camila, viajera frecuente', 'Entrevista de 60 min en su oficina. Reclamo por maleta con rueda rota en vuelo nacional.'),
    p2: source('entrevista', '2026-03-12', 'P2 · Andrés, viaje familiar', 'Entrevista remota. Maleta con cierre roto; no sabía que tenía 7 días para reclamar.'),
    obs: source('observación', '2026-03-15', 'Mostrador de equipaje, Terminal 2', 'Observación de 3 horas en el mostrador de reclamos. 14 reclamos registrados.'),
    survey: source('encuesta', '2026-03-20', 'Encuesta post-reclamo (n=212)', 'Encuesta enviada a pasajeros con reclamo cerrado en los últimos 6 meses.'),
    analytics: source('analítica', '2026-03-22', 'Formulario web de reclamos', 'Embudo del formulario: 58 % abandona en el paso de adjuntar fotos.'),
    doc: source('documento', '2026-02-28', 'Política de compensación 2026', 'Documento interno con topes de compensación y plazos.'),
  }
  const sources = Object.values(src)

  /* Persona */
  const persona: Persona = {
    id: newId(),
    name: 'Camila, viajera de negocios',
    portrait: '',
    demographics: '34 años · Consultora · Viaja 2–3 veces al mes',
    quote: 'No me molesta que pase algo; me molesta no saber qué va a pasar después.',
    contextImages: [],
    description:
      'Viaja por trabajo con equipaje de mano y una maleta despachada. Valora el tiempo por encima de todo y resuelve trámites desde el celular.',
    needs: ['Saber en qué estado está su reclamo', 'Resolver sin volver al aeropuerto'],
    motivations: ['Recuperar el valor de su maleta', 'Seguir con su agenda sin retrasos'],
    frustrations: ['Repetir la misma información varias veces', 'Plazos que nadie le explicó'],
    stats: [
      { label: 'Viajes al año', value: '30' },
      { label: 'Reclamos previos', value: '2' },
    ],
    basis: 'investigación',
    createdAt: '2025-10-01',
    expiresAt: '2026-10-01',
  }

  /* Etapas y pasos */
  const stages: Stage[] = [
    { id: newId(), name: 'Antes' },
    { id: newId(), name: 'Durante' },
    { id: newId(), name: 'Después' },
  ]
  const [antes, durante, despues] = stages
  const s = {
    cinta: step(antes, 0, 'Espera la maleta en la cinta', 'touchpoint', 0),
    descubre: step(antes, 1, 'Descubre la maleta dañada', 'fuera de la organización', -2, true),
    busca: step(durante, 0, 'Busca dónde reclamar', 'touchpoint', -1),
    fila: step(durante, 1, 'Hace fila en el mostrador', 'touchpoint', -1, true),
    formulario: step(durante, 2, 'Completa el formulario de daño', 'touchpoint', -2),
    caso: step(durante, 3, 'Recibe su número de caso', 'touchpoint', 0),
    espera: step(despues, 0, 'Espera una respuesta', 'fuera de la organización', -2),
    compensa: step(despues, 1, 'Recibe la compensación', 'touchpoint', 1, true),
  }
  const steps = Object.values(s)

  /* Carriles por defecto, con acceso por nombre */
  const lanes = defaultLanes()
  const lane = (name: string) => lanes.find((l) => l.name === name)!.id
  const L = {
    story: lane('Storyboard'),
    accion: lane('Acción del cliente'),
    canal: lane('Canal'),
    evidencia: lane('Evidencia física'),
    citas: lane('Pensamientos y citas'),
    pain: lane('Pain points'),
    opp: lane('Oportunidades'),
    personal: lane('Comportamiento del personal'),
    conocimiento: lane('Conocimiento'),
    procesos: lane('Procesos'),
    sistemas: lane('Sistemas y herramientas'),
    stakeholders: lane('Stakeholders'),
    kpis: lane('KPIs'),
  }

  /* Tarjetas: (paso, carril, texto, basis, tipo de dato, fuente) */
  const cards: Card[] = []
  const card = (
    st: Step,
    laneId: string,
    text: string,
    basis: Basis,
    dataType: DataType,
    source?: Source,
  ) => {
    const order = cards.filter((c) => c.stepId === st.id && c.laneId === laneId).length
    cards.push({
      id: newId(),
      stepId: st.id,
      laneId,
      text,
      basis,
      dataType,
      order,
      ...(source ? { sourceId: source.id } : {}),
    })
  }
  const R = 'investigación' as const
  const S = 'supuesto' as const

  // 1. Espera en la cinta
  card(s.cinta, L.story, 'Camila mira la cinta con el teléfono en la mano, pendiente de la hora.', S, 'interpretado')
  card(s.cinta, L.accion, 'Espera su maleta en la cinta asignada.', R, 'crudo', src.obs)
  card(s.cinta, L.canal, 'Sala de equipaje', S, 'interpretado')
  card(s.cinta, L.evidencia, 'Pantalla con número de cinta', R, 'crudo', src.obs)
  card(s.cinta, L.citas, '"Siempre calculo 20 minutos para la maleta."', R, 'crudo', src.p1)
  card(s.cinta, L.personal, 'Operarios descargan sin revisar el estado de las maletas.', S, 'interpretado')
  card(s.cinta, L.kpis, 'Tiempo de entrega de equipaje', S, 'interpretado')

  // 2. Descubre el daño
  card(s.descubre, L.story, 'Levanta la maleta y la rueda queda colgando.', R, 'crudo', src.p1)
  card(s.descubre, L.accion, 'Revisa la maleta y toma fotos del daño.', R, 'crudo', src.obs)
  card(s.descubre, L.citas, '"¿Y ahora a quién le digo?"', R, 'crudo', src.p2)
  card(s.descubre, L.pain, 'No hay ningún aviso sobre qué hacer si la maleta llega dañada.', R, 'interpretado', src.obs)
  card(s.descubre, L.opp, 'Señalética en la cinta con un QR para reportar el daño en el momento.', S, 'interpretado')
  card(s.descubre, L.stakeholders, 'Empresa de handling (proveedor externo)', R, 'crudo', src.doc)

  // 3. Busca dónde reclamar
  card(s.busca, L.accion, 'Pregunta a un guardia dónde reclamar.', R, 'crudo', src.obs)
  card(s.busca, L.canal, 'Personal del aeropuerto', S, 'interpretado')
  card(s.busca, L.pain, 'El mostrador de reclamos está fuera de la vista, detrás de las cintas.', R, 'interpretado', src.obs)
  card(s.busca, L.opp, 'Guiar desde la app de la aerolínea al aterrizar.', S, 'interpretado')
  card(s.busca, L.conocimiento, 'El personal del aeropuerto no conoce el proceso de cada aerolínea.', S, 'interpretado')

  // 4. Fila en el mostrador
  card(s.fila, L.story, 'Fila de ocho personas; un solo agente atendiendo.', R, 'crudo', src.obs)
  card(s.fila, L.accion, 'Hace fila entre 25 y 40 minutos.', R, 'crudo', src.obs)
  card(s.fila, L.canal, 'Mostrador de equipaje', R, 'crudo', src.obs)
  card(s.fila, L.citas, '"Perdí la reunión de la tarde por estar ahí."', R, 'crudo', src.p1)
  card(s.fila, L.pain, 'La espera se siente como un castigo por algo que no fue su culpa.', S, 'interpretado')
  card(s.fila, L.personal, 'El agente atiende reclamos y equipaje perdido al mismo tiempo.', R, 'crudo', src.obs)
  card(s.fila, L.procesos, 'Turno único de un agente entre las 14:00 y las 18:00.', S, 'interpretado')
  card(s.fila, L.kpis, 'Tiempo de espera en mostrador', S, 'interpretado')

  // 5. Formulario
  card(s.formulario, L.accion, 'Completa un formulario en papel y luego otro en la web.', R, 'crudo', src.p2)
  card(s.formulario, L.canal, 'Formulario en papel + web', R, 'crudo', src.analytics)
  card(s.formulario, L.evidencia, 'Formulario PIR impreso', R, 'crudo', src.obs)
  card(s.formulario, L.pain, 'El 58 % abandona el formulario web al adjuntar fotos.', R, 'crudo', src.analytics)
  card(s.formulario, L.pain, 'Debe escribir dos veces los mismos datos.', R, 'interpretado', src.p2)
  card(s.formulario, L.opp, 'Un único formulario digital con los datos del vuelo ya cargados.', S, 'interpretado')
  card(s.formulario, L.sistemas, 'Sistema central de registro de equipaje', S, 'crudo')
  card(s.formulario, L.sistemas, 'Formulario web sin conexión con el sistema central.', S, 'interpretado')

  // 6. Número de caso
  card(s.caso, L.accion, 'Recibe un papel con el número de caso.', R, 'crudo', src.obs)
  card(s.caso, L.evidencia, 'Comprobante impreso con número de caso', R, 'crudo', src.obs)
  card(s.caso, L.citas, '"Me dieron un número, pero nadie me dijo cuánto se demora."', R, 'crudo', src.p1)
  card(s.caso, L.opp, 'Explicar los plazos y los próximos pasos en el comprobante.', S, 'interpretado')
  card(s.caso, L.procesos, 'El caso se asigna a la central de reclamos en 24–48 h.', R, 'crudo', src.doc)

  // 7. Espera
  card(s.espera, L.accion, 'Escribe al call center y a redes sociales para saber del caso.', R, 'crudo', src.survey)
  card(s.espera, L.canal, 'Call center, email, redes sociales', R, 'crudo', src.survey)
  card(s.espera, L.pain, 'El 64 % no recibió ninguna actualización durante la espera.', R, 'crudo', src.survey)
  card(s.espera, L.citas, '"Sentí que mi reclamo cayó en un hoyo negro."', R, 'crudo', src.p2)
  card(s.espera, L.opp, 'Notificaciones proactivas del estado del caso.', S, 'interpretado')
  card(s.espera, L.conocimiento, 'El call center no ve el estado de los reclamos de equipaje.', S, 'interpretado')
  card(s.espera, L.kpis, 'Días hasta la primera respuesta', S, 'interpretado')

  // 8. Compensación
  card(s.compensa, L.accion, 'Recibe una transferencia por el valor aprobado.', R, 'crudo', src.survey)
  card(s.compensa, L.canal, 'Email + transferencia bancaria', S, 'interpretado')
  card(s.compensa, L.citas, '"Al final me pagaron, pero no volvería a pasar por eso."', R, 'crudo', src.p1)
  card(s.compensa, L.opp, 'Ofrecer compensación inmediata en millas para daños menores.', S, 'interpretado')
  card(s.compensa, L.procesos, 'Aprobación manual según tope de la política de compensación.', R, 'crudo', src.doc)
  card(s.compensa, L.stakeholders, 'Área de finanzas', S, 'interpretado')
  card(s.compensa, L.kpis, 'NPS post-reclamo', S, 'interpretado')

  const map: JourneyMap = {
    id: newId(),
    title: 'Reclamo de equipaje dañado — estado actual',
    designQuestion:
      '¿Cómo podríamos hacer que reclamar una maleta dañada sea rápido y que la persona siempre sepa qué va a pasar?',
    personaId: persona.id,
    scenario:
      'Camila aterriza de un viaje de trabajo y encuentra su maleta con una rueda rota. Tiene una reunión en dos horas.',
    zoom: 'end-to-end',
    state: 'actual',
    researchStatement: {
      methods: 'Entrevistas en profundidad, observación en mostrador, encuesta post-reclamo, analítica web, revisión documental',
      interviewCount: 2,
      dateFrom: '2026-02-28',
      dateTo: '2026-03-22',
      places: 'Terminal 2 del aeropuerto, entrevistas remotas',
      triangulationNotes:
        'Las esperas en el mostrador se confirman con observación y entrevistas. La falta de actualizaciones se confirma con encuesta (n=212) y entrevistas. Faltan entrevistas al personal.',
    },
    stages,
    steps,
    lanes,
    cards,
    principles: defaultPrinciples().map((p) =>
      p.id === 'secuencial'
        ? { ...p, checked: true, note: 'El mapa sigue el recorrido paso a paso, de la cinta al pago.' }
        : p.id === 'real'
          ? { ...p, checked: true, note: 'Basado en observación en terreno y encuesta.' }
          : p,
    ),
  }

  return {
    id: newId(),
    name: 'Ejemplo · Aerolínea: equipaje dañado',
    description:
      'Proyecto de ejemplo para explorar la app: reclamo de una maleta dañada en una aerolínea ficticia.',
    maps: [map],
    personas: [persona],
    sources,
    createdAt: '2026-03-01',
    updatedAt: '2026-03-22',
  }

  /* ---------- ayudantes locales ---------- */

  function source(type: Source['type'], date: string, participant: string, note: string): Source {
    return { id: newId(), type, date, participant, note, link: '' }
  }

  function step(
    stage: Stage,
    order: number,
    title: string,
    type: StepType,
    emotion: Emotion,
    momentOfTruth = false,
  ): Step {
    return { id: newId(), stageId: stage.id, title, type, momentOfTruth, emotion, order }
  }
}
