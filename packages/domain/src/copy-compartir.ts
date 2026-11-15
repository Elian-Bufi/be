/**
 * WP-COMPARTIR (DEUDA_LEGAJO DL-176) · los textos de la pantalla única de consentimiento, de la tarjeta para quien ya tiene
 * vínculos y de lo que suma «Quién ve qué». En español rioplatense, con las reglas de siempre:
 * - **ubicar, nunca calificar**; sin «asesorado», «cumplimiento», «adherencia», «racha» ni «puntaje», y sin «%»;
 * - **10-B04:** ningún texto dice que alguien «puede ver todos tus datos»; cada línea dice qué, de quién, para quién y para
 *   qué. «Aceptar y compartir» es el botón de esta pantalla, la del consentimiento: el vínculo se acepta antes, aparte, con
 *   «Aceptar vínculo» (10-B04 prohíbe «Aceptar y compartir datos» al aceptar el vínculo porque fusiona vínculo y B2; acá no
 *   se fusionan, DL-176 lo registra);
 * - **la persona decide:** lo que se retira, se retira desde ese momento, y las notas privadas de los profesionales nunca se
 *   comparten.
 */
import { ETIQUETA_DE_ALCANCE, type Alcance } from './alcance';

const area = (a: Alcance): string => ETIQUETA_DE_ALCANCE[a];

/** «Lic. Paz», «Lic. Paz y Prof. Ruiz», «Lic. Paz, Prof. Ruiz y Lic. Gómez». */
export function enumerarNombres(nombres: readonly string[]): string {
  if (nombres.length <= 1) return nombres[0] ?? '';
  return `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`;
}

export const COPY_COMPARTIR = {
  // ── La pantalla única (al aceptar el vínculo, o al revisarlo) ──
  titulo: (nombre: string) => `Qué compartís con ${nombre}`,
  /** Qué ve y para qué, en pocas líneas (Ley 25.326, art. 5: libre, expreso e informado). */
  intro: (nombre: string, a: Alcance) =>
    `${nombre} te va a acompañar en ${area(a)}. Para eso necesita ver tus datos de ${area(a)}. Y para planificar teniendo en cuenta todo lo tuyo, sirve que vea el resumen y el plan vigente de tus otras áreas, y que tus otros profesionales vean lo de ${area(a)}.`,
  introDeTodo: 'Para que tus profesionales planifiquen teniendo en cuenta todo lo tuyo, sirve que cada uno vea el resumen y el plan vigente de tus otras áreas.',
  loQueCompartis: 'Lo que vas a compartir',
  yaLoCompartis: 'Lo que ya compartís',
  nuncaSeComparte: 'Las notas privadas de tus profesionales nunca se comparten.',
  podesRetirar: 'Podés retirar cada cosa cuando quieras en «Quién ve qué», en tu Perfil: deja de verse desde ese momento, y no se borra nada.',
  alTocar: 'Al tocar «Aceptar y compartir» aceptás los textos de lo que compartís:',
  losTextos: 'Los textos completos',
  propuestos: 'Algunos textos son propuestas, pendientes de validación jurídica.',
  aceptarYCompartir: 'Aceptar y compartir',
  /** En «Elegir qué compartir», con lo que quedó marcado. */
  compartirLoElegido: 'Aceptar y compartir lo elegido',
  elegir: 'Elegir qué compartir',
  ahoraNo: 'Ahora no',
  nadaElegido: 'No elegiste nada para compartir. Podés volver cuando quieras desde el vínculo o desde «Quién ve qué».',
  compartiendo: 'Compartiendo…',
  /** Lo que se dice a la vista de cada cosa: qué, de quién, para quién y para qué. */
  linea: {
    HEALTH_DATA: 'Tus datos de salud en BE: que BE los guarde y los use para acompañarte. Sin esto, ningún profesional ve tus datos de salud.',
    AREA_CONSENT: (nombre: string, a: Alcance, finalidad: string) => `Tus datos de ${area(a)}, para ${nombre}: para ${finalidad.toLowerCase()}.`,
    SUMMARY: (para: string, a: Alcance, de: string, conPlan: boolean) => (conPlan ? `El resumen y el plan vigente de ${area(a)} (de ${de}), para ${para}.` : `El resumen de ${area(a)} (de ${de}), para ${para}.`),
    PREVIOUS_HISTORY: (nombre: string, a: Alcance) => `Tu historia anterior de ${area(a)}, para ${nombre}: lo que pasó antes en ${area(a)} con otros profesionales.`,
    HABITS: (nombre: string) => `Tus hábitos, para ${nombre}.`,
  },
  desde: (dia: string) => `Desde el ${dia}`,
  /** Lo que pide el A3 sin el A3 elegido: se dice al lado, sin esconderlo. */
  pideElA3: 'Para compartir esto hace falta tu consentimiento de datos de salud.',
  /** La etiqueta de cada interruptor para TalkBack: qué, y si queda compartido. */
  interruptorParaLeer: (linea: string, marcado: boolean) => `${linea} ${marcado ? 'Se comparte.' : 'No se comparte.'}`,
  sugerenciaDelInterruptor: (marcado: boolean) => (marcado ? 'Tocá para no compartirlo' : 'Tocá para compartirlo'),
  listo: 'Listo: quedó registrado lo que compartís.',
  listoDetalle: 'Lo podés cambiar cuando quieras en «Quién ve qué», en tu Perfil.',
  irAQuienVeQue: 'Ir a «Quién ve qué»',
  verVinculo: 'Ver vínculo',
  cambioAntes: 'Algo cambió mientras lo mirabas. Actualizá la vista y probá de nuevo.',
  actualizar: 'Actualizar',
  noSePudo: 'No se pudo guardar. Probá de nuevo.',
  vinculoNoAceptado: 'Este vínculo no está aceptado: por ahora no hay nada para compartir.',

  // ── La tarjeta única, para quien ya tiene vínculos ──
  tarjeta: {
    titulo: 'Compartí lo tuyo entre tus profesionales',
    cuerpo: 'Con el resumen y el plan de tus otras áreas, cada profesional planifica teniendo en cuenta todo lo tuyo. Vos elegís, y lo podés cambiar cuando quieras.',
    compartirTodo: 'Compartir todo con tus profesionales',
    ahoraNo: 'Ahora no',
  },

  // ── «Quién ve qué» ──
  queVeDeOtrasAreas: 'Lo que ve de tus otras áreas',
  interruptorDeResumen: (a: Alcance, conPlan: boolean) => (conPlan ? `El resumen y el plan de ${area(a)}` : `El resumen de ${area(a)}`),
  interruptorDeHabitos: 'Tus hábitos',
  loVe: (dia: string) => `Lo ve desde el ${dia}`,
  noLoVe: 'No lo ve',
  retirando: 'Dejando de compartir…',
  confirmarRetiro: {
    titulo: 'Dejar de compartir',
    cuerpo: (que: string, nombre: string) => `${nombre} deja de ver ${que} desde ahora. No se borra nada, y lo podés volver a compartir cuando quieras.`,
    confirmar: 'Dejar de compartir',
  },
  confirmarDar: {
    titulo: 'Compartir',
    leeAntes: 'Leé el texto antes de decidir: es lo que aceptás si lo compartís.',
    confirmar: 'Sí, compartir',
    cancelar: 'Ahora no',
  },
  pedidos: {
    titulo: 'Pedidos para responder',
    deUnPlan: (nombre: string, a: Alcance, desde: Alcance) => `${nombre} te pidió ver el resumen y el plan de ${area(a)}, para acompañarte en ${area(desde)}.`,
    deHabitos: (nombre: string, desde: Alcance) => `${nombre} te pidió ver tus hábitos, para acompañarte en ${area(desde)}.`,
    si: 'Sí, compartir',
    ahoraNo: 'Ahora no',
    respondido: 'Listo: quedó registrada tu respuesta.',
  },
} as const;

/** Todos los textos que se muestran, armados con valores de prueba: para las pruebas de vocabulario. */
export function textosDeCompartir(): readonly string[] {
  const C = COPY_COMPARTIR;
  const areas: Alcance[] = ['NUTRICION', 'ENTRENAMIENTO', 'ANTROPOMETRIA'];
  return [
    C.introDeTodo, C.loQueCompartis, C.yaLoCompartis, C.nuncaSeComparte, C.podesRetirar, C.alTocar, C.losTextos, C.propuestos, C.aceptarYCompartir, C.compartirLoElegido,
    C.elegir, C.ahoraNo, C.nadaElegido, C.compartiendo, C.linea.HEALTH_DATA, C.linea.HABITS('Lic. Sofía Paz'), C.desde('3/11/2026'), C.pideElA3,
    C.interruptorParaLeer('Tus hábitos, para Lic. Sofía Paz.', true), C.interruptorParaLeer('Tus hábitos, para Lic. Sofía Paz.', false), C.sugerenciaDelInterruptor(true), C.sugerenciaDelInterruptor(false),
    C.listo, C.listoDetalle, C.irAQuienVeQue, C.verVinculo, C.cambioAntes, C.actualizar, C.noSePudo, C.vinculoNoAceptado,
    ...Object.values(C.tarjeta), C.queVeDeOtrasAreas, C.interruptorDeHabitos, C.loVe('3/11/2026'), C.noLoVe, C.retirando,
    C.confirmarRetiro.titulo, C.confirmarRetiro.cuerpo('tus hábitos', 'Lic. Sofía Paz'), C.confirmarRetiro.confirmar,
    C.confirmarDar.titulo, C.confirmarDar.leeAntes, C.confirmarDar.confirmar, C.confirmarDar.cancelar,
    C.pedidos.titulo, C.pedidos.si, C.pedidos.ahoraNo, C.pedidos.respondido, enumerarNombres(['Lic. Paz', 'Prof. Ruiz', 'Lic. Gómez']),
    ...areas.flatMap((a) => [
      C.titulo('Lic. Sofía Paz'),
      C.intro('Lic. Sofía Paz', a),
      C.linea.AREA_CONSENT('Lic. Sofía Paz', a, 'Acompañamiento nutricional'),
      C.linea.SUMMARY('Prof. Ruiz', a, 'Lic. Sofía Paz', true),
      C.linea.SUMMARY('Prof. Ruiz', a, 'Lic. Sofía Paz', false),
      C.linea.PREVIOUS_HISTORY('Lic. Sofía Paz', a),
      C.interruptorDeResumen(a, true),
      C.interruptorDeResumen(a, false),
      C.pedidos.deUnPlan('Prof. Ruiz', a, 'ENTRENAMIENTO'),
      C.pedidos.deHabitos('Prof. Ruiz', a),
    ]),
  ];
}
