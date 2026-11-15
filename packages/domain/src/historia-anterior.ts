/**
 * WP-HISTORIA-ANTERIOR (DEUDA_LEGAJO DL-175; 08 §14.1, la fila «Cambio de profesional»; REG-06-55; RF-025): la persona
 * autoriza, desde la app, al profesional nuevo de un área a ver su **historia anterior de esa área**, lo que pasó con otros
 * profesionales en esa misma área antes de que él la acompañara. Lógica pura, sin base ni red: la usan la API, la APK y el
 * website, y la prueban `historia-anterior.test.ts` (TEST-HA-001 a 012).
 *
 * Lo que decidió Dirección (2026-11-15, «Programarlo»), y que este módulo sostiene:
 * - **quién y cuándo:** la persona, por profesional y por área (el componente de vínculo de ese profesional en esa área);
 * - **cómo lo ve:** en solo lectura y marcado como de otro profesional, sin nombrarlo (`AutorDeLaHistoriaAnterior`);
 * - **qué entra:** los planes que tuvo (las versiones activadas, nunca los borradores), lo que registró bajo esos planes, las
 *   tomas antropométricas con su método y las decisiones de las revisiones (resultado, fundamento y próxima acción). Cada
 *   área trae lo suyo (`LO_QUE_ENTRA`): Antropometría no tiene planes ni revisiones, y las otras dos no tienen tomas;
 * - **qué no entra nunca:** las notas privadas del profesional anterior (las notas propias, PG-16), sus borradores ni sus
 *   notas internas. Tampoco otra área ni lo propio del que lee;
 * - **cómo se controla:** la autorización se puede retirar siempre, queda auditada y la persona ve cuándo la miró.
 *
 * «Anterior» quiere decir **antes de que empezara el acompañamiento de quien lee** (HA-T03): el corte es el comienzo de su
 * componente de vínculo en esa área. Lo que otro profesional registró después (porque la acompañaba a la vez) no es
 * historia anterior, y el aviso del website («antes de tu acompañamiento») dice la verdad.
 */
import { ETIQUETA_DE_ALCANCE, type Alcance } from './alcance';
import { diaSiguiente, diasEntreFechas, esFechaCivil } from './fechas-civiles';
import { lunesDe } from './series-del-analisis';

// ─── Lo que entra de cada área ──────────────────────────────────────────────────────────────────────────────────────

/** Las partes de una historia anterior, con los tokens del contrato. */
export const PARTES_DE_LA_HISTORIA_ANTERIOR = ['PLANS', 'RECORDS', 'MEASUREMENTS', 'DECISIONS'] as const;
export type ParteDeLaHistoriaAnterior = (typeof PARTES_DE_LA_HISTORIA_ANTERIOR)[number];

/**
 * HA-T02: lo que entra de cada área, en el orden en que se muestra. Nutrición y Entrenamiento tienen planes, lo registrado y
 * las decisiones de las revisiones; Antropometría no tiene ciclo de plan propio (06:6221): solo sus tomas, con su método.
 */
export const LO_QUE_ENTRA: Readonly<Record<Alcance, readonly ParteDeLaHistoriaAnterior[]>> = {
  NUTRICION: ['PLANS', 'RECORDS', 'DECISIONS'],
  ENTRENAMIENTO: ['PLANS', 'RECORDS', 'DECISIONS'],
  ANTROPOMETRIA: ['MEASUREMENTS'],
};

/** Lo que nunca entra, para decirlo en el texto y para que una prueba lo fije. */
export const LO_QUE_NUNCA_ENTRA = ['NOTAS_PROPIAS', 'BORRADORES', 'NOTAS_INTERNAS', 'OTRAS_AREAS', 'LO_PROPIO_DEL_QUE_LEE'] as const;

// ─── El texto que la persona acepta (HA-T05) ────────────────────────────────────────────────────────────────────────

/**
 * El texto de la autorización, con su id y su hash (08 §12.2: la mostrada es la aceptada). Es una **propuesta**, pendiente
 * de validación jurídica, como los textos de los hábitos y de lo de otras áreas; no está en el catálogo de textos legales
 * (`CATALOGO_DE_TEXTOS`) porque sumar un tipo ahí es una revisión legal aparte (HA-T05). La fila de la autorización guarda
 * el id y el hash, y la API solo acepta el vigente. El hash es el SHA-256 del texto en UTF-8: `historia-anterior.test.ts`
 * lo verifica.
 */
export const TEXTO_DE_LA_HISTORIA_ANTERIOR = {
  id: 'historia-anterior-2026-11-propuesta',
  titulo: 'Tu historia anterior, para tu profesional nuevo',
  vigenteDesde: '2026-11-15T00:00:00.000Z',
  texto: `Tu historia anterior, para tu profesional nuevo — versión propuesta 2026-11

Texto de demostración para el trabajo final BE. No es un texto legal ni se aplica a datos reales.

Texto propuesto, pendiente de validación jurídica.

Esta autorización es para que el profesional que te acompaña ahora en un área vea lo que pasó en esa misma área con otros profesionales, antes de que él empezara a acompañarte.

Qué ve, en solo lectura y marcado como de otro profesional, sin su nombre: en Nutrición y en Entrenamiento, las versiones de los planes que se activaron (nunca los borradores), lo que registraste bajo esos planes y las decisiones de las revisiones, con su resultado, su fundamento y la próxima acción; en Antropometría, las tomas, con su método.

Qué no ve nunca: las notas privadas de los otros profesionales, sus borradores ni sus notas internas. Tampoco ve lo de otras áreas.

La autorización es para ese profesional y para esa área. La podés retirar cuando quieras desde «Quién ve qué», en tu Perfil: desde ese momento deja de verla, y no se borra nada. Cada vez que la mira queda registrado, y lo ves ahí mismo.

Para verla, además, ese profesional tiene que acompañarte en esa área, con tu autorización de acceso vigente.`,
  hash: '444117df85d68a53be4e46a67124261908c1c6f575b96825795370f6c38d019b',
  propuesta: true,
} as const;

// ─── Los textos de las pantallas (los de la APK y los del website) ──────────────────────────────────────────────────

/** El área con las palabras de BE. */
const area = (a: Alcance): string => ETIQUETA_DE_ALCANCE[a];

/** Lo que entra, dicho para la persona: «tus planes, registros y decisiones anteriores de Nutrición». */
export function loQueLeMuestra(a: Alcance): string {
  if (a === 'ANTROPOMETRIA') return `tus tomas anteriores de ${area(a)}, con su método`;
  return `tus planes, registros y decisiones anteriores de ${area(a)}`;
}

export const COPY_HISTORIA_ANTERIOR = {
  // ── La persona, en la APK ──
  titulo: (a: Alcance) => `Tu historia anterior de ${area(a)}`,
  /** La explicación corta de «Quién ve qué» y de la tarjeta al aceptar a alguien nuevo. */
  explicacion: (nombre: string, a: Alcance) => `Le muestra a ${nombre} ${loQueLeMuestra(a)}, con otros profesionales. Sus notas privadas no se comparten.`,
  interruptor: 'Compartir mi historia anterior',
  interruptorParaLeer: (nombre: string, a: Alcance) => `Compartir tu historia anterior de ${area(a)} con ${nombre}`,
  laVe: (desde: string) => `La ve desde el ${desde}`,
  noLaVe: 'No la ve',
  enPausa: 'Con el vínculo en pausa no la ve, aunque la compartas',
  miro: (cuando: string) => `Miró tu historia anterior ${cuando}`,
  todaviaNoLaMiro: 'Todavía no miró tu historia anterior',
  leerElTexto: 'Leer el texto completo',
  propuesta: 'Texto propuesto, pendiente de validación jurídica.',
  compartiendo: 'Compartiendo…',
  retirando: 'Dejando de compartir…',
  compartida: (nombre: string) => `Listo: ${nombre} puede ver tu historia anterior.`,
  retirada: (nombre: string) => `Listo: ${nombre} ya no ve tu historia anterior. No se borró nada.`,
  confirmarRetiro: {
    titulo: 'Dejar de compartir tu historia anterior',
    cuerpo: (nombre: string) => `${nombre} deja de verla desde ahora. No se borra nada, y la podés volver a compartir cuando quieras.`,
    confirmar: 'Dejar de compartir',
    cancelar: 'Seguir compartiendo',
  },
  /** La tarjeta opcional al aceptar a un profesional nuevo de un área en la que ya hubo otro. Por omisión, no se comparte. */
  alAceptar: {
    titulo: (nombre: string, a: Alcance) => `¿Le mostrás a ${nombre} tu historia anterior de ${area(a)}?`,
    opcional: 'Es opcional: si no la compartís, no la ve. Lo podés cambiar cuando quieras en «Quién ve qué».',
    compartir: 'Compartir mi historia anterior',
    ahoraNo: 'Ahora no',
  },
  noSePudo: 'No se pudo guardar. Probá de nuevo.',
  cambioAntes: 'Esto cambió mientras lo mirabas. Actualizá la vista y probá de nuevo.',
  sinElA3: 'Para compartirla, primero tenés que autorizar el tratamiento de tus datos de salud, en Privacidad.',

  // ── El profesional, en el website ──
  ruta: 'Historia anterior',
  tituloDelArea: (a: Alcance) => `Historia anterior de ${area(a)}`,
  aviso: 'Lo que sigue pasó con otro profesional, antes de tu acompañamiento. Solo lectura.',
  /** Sin la autorización: cómo pedírsela, sin mostrar ni insinuar datos. */
  comoPedirla: {
    titulo: 'Para ver la historia anterior, la persona tiene que autorizarte',
    cuerpo: (a: Alcance) =>
      `Si la persona tuvo antes otro profesional de ${area(a)}, puede autorizarte a ver esa historia desde su app: en Perfil, «Quién ve qué», debajo de tu nombre, «Tu historia anterior de ${area(a)}». Pedíselo en la próxima consulta; BE no le manda ningún aviso desde acá.`,
    sinAcceso: 'También hace falta que la acompañes hoy en esta área, con su autorización de acceso vigente.',
  },
  deOtroProfesional: 'De otro profesional',
  deOtroProfesionalN: (n: number) => `De otro profesional (${n}.º)`,
  secciones: { PLANS: 'Planes', RECORDS: 'Lo registrado', MEASUREMENTS: 'Tomas', DECISIONS: 'Decisiones de las revisiones' } satisfies Readonly<Record<ParteDeLaHistoriaAnterior, string>>,
  vacio: {
    PLANS: 'En este tramo no hay versiones de planes de antes.',
    RECORDS: 'En este tramo no hay nada registrado de antes.',
    MEASUREMENTS: 'En este tramo no hay tomas de antes.',
    DECISIONS: 'En este tramo no hay decisiones de revisiones de antes.',
  } satisfies Readonly<Record<ParteDeLaHistoriaAnterior, string>>,
  sinHistoria: 'La persona te autorizó, pero en esta área no hay nada de antes de tu acompañamiento.',
  tramo: (desde: string, hasta: string) => `Del ${desde} al ${hasta}`,
  tramoAnterior: 'Tramo anterior',
  tramoSiguiente: 'Tramo siguiente',
  laHistoriaVa: (desde: string, hasta: string) => `La historia anterior va del ${desde} al ${hasta}.`,
  version: (n: number) => `Versión ${n}`,
  vigencia: (desde: string, hasta: string | null) => (hasta === null ? `Desde el ${desde}` : `Del ${desde} al ${hasta}`),
  seguiaVigente: 'Seguía vigente cuando empezó tu acompañamiento.',
  motivoDelCorte: { SUCCESSOR_ACTIVATED: 'La reemplazó una versión nueva.', FOLLOW_UP_CLOSED: 'Se cerró el seguimiento.' } as const,
  semana: (desde: string, hasta: string) => `Semana del ${desde} al ${hasta}`,
  comidasRegistradas: (n: number) => (n === 1 ? '1 comida registrada' : `${n} comidas registradas`),
  sesionesRegistradas: (n: number) => (n === 1 ? '1 sesión registrada' : `${n} sesiones registradas`),
  opcionDelPlan: 'Opción del plan',
  algoDiferente: 'Comió algo diferente',
  anulado: 'Anulado',
  corregida: 'Corregida después',
  ejercicios: (n: number) => (n === 1 ? '1 ejercicio' : `${n} ejercicios`),
  metodo: (nombre: string) => `Método: ${nombre}`,
  protocolo: (nombre: string) => `Protocolo: ${nombre}`,
  calculado: 'Calculado por BE',
  resultado: 'Resultado',
  fundamento: 'Fundamento',
  proximaAccion: 'Próxima acción',
  proximaRevision: (dia: string) => `Próxima revisión: ${dia}`,
  periodoRevisado: (desde: string, hasta: string) => `Período revisado: del ${desde} al ${hasta}`,
} as const;

// ─── El autor, sin nombrarlo ────────────────────────────────────────────────────────────────────────────────────────

/** Cómo viaja el autor de cada cosa: de otro profesional, con su orden (el 1.º es el que empezó antes), sin nombre. */
export interface AutorDeLaHistoriaAnterior {
  readonly kind: 'OTHER_PROFESSIONAL';
  readonly ordinal: number;
}

/**
 * Los otros profesionales del área, en el orden en que empezaron a acompañarla, cada uno con su número: 1, 2… Entran solo
 * los que empezaron **antes** del corte y no son quien lee (TEST-HA-003). Uno con varios componentes cuenta una vez, desde
 * el primero. Los empates se ordenan por el identificador, para que el número no cambie de una lectura a otra.
 */
export function ordinalesDeLosAnteriores(
  componentes: readonly { readonly profesionalId: string; readonly inicio: string }[],
  p: { readonly lectorId: string; readonly corte: string },
): ReadonlyMap<string, number> {
  const primero = new Map<string, string>();
  for (const c of componentes) {
    if (c.profesionalId === p.lectorId || !(c.inicio < p.corte)) continue;
    const antes = primero.get(c.profesionalId);
    if (antes === undefined || c.inicio < antes) primero.set(c.profesionalId, c.inicio);
  }
  const orden = [...primero.entries()].sort((a, b) => (a[1] === b[1] ? a[0].localeCompare(b[0]) : a[1] < b[1] ? -1 : 1));
  return new Map(orden.map(([id], i) => [id, i + 1]));
}

export const autorDeOtro = (ordinal: number): AutorDeLaHistoriaAnterior => ({ kind: 'OTHER_PROFESSIONAL', ordinal });

// ─── La autorización ────────────────────────────────────────────────────────────────────────────────────────────────

export type EstadoDeLaAutorizacionAnterior = 'VIGENTE' | 'RETIRADA';

/** La última versión de la autorización de un componente: es la que vale (las anteriores son su historia). */
export function ultimaVersion<T extends { readonly version: number }>(filas: readonly T[]): T | null {
  return filas.reduce<T | null>((u, f) => (u === null || f.version > u.version ? f : u), null);
}

/** Si un profesional puede leer: solo con la última versión VIGENTE (TEST-HA-004). Retirada o sin decidir, no. */
export const autorizacionVigente = (filas: readonly { readonly version: number; readonly estado: EstadoDeLaAutorizacionAnterior }[]): boolean => ultimaVersion(filas)?.estado === 'VIGENTE';

/**
 * Qué hace un pedido de la persona con lo que ella vio (`expectedVersion`), como API-RES-02 y 03:
 * - autorizar con la última versión que vio: VIGENTE nueva; si ya estaba VIGENTE, nada (PUT es idempotente por estado);
 * - retirar: solo una VIGENTE, con su versión;
 * - si lo que vio no es lo último, el 409 de siempre (VERSION_CONFLICT).
 */
export function decidirCambioDeAutorizacion(p: {
  readonly ultima: { readonly version: number; readonly estado: EstadoDeLaAutorizacionAnterior } | null;
  readonly pedido: 'AUTORIZAR' | 'RETIRAR';
  readonly versionVista: string | null;
}): { readonly tipo: 'AGREGAR'; readonly estado: EstadoDeLaAutorizacionAnterior; readonly version: number } | { readonly tipo: 'SIN_CAMBIO' } | { readonly tipo: 'CONFLICTO' } {
  const actual = p.ultima ? `v${p.ultima.version}` : null;
  if (actual !== p.versionVista) return { tipo: 'CONFLICTO' };
  if (p.pedido === 'RETIRAR') {
    if (p.ultima?.estado !== 'VIGENTE') return { tipo: 'CONFLICTO' };
    return { tipo: 'AGREGAR', estado: 'RETIRADA', version: p.ultima.version + 1 };
  }
  if (p.ultima?.estado === 'VIGENTE') return { tipo: 'SIN_CAMBIO' };
  return { tipo: 'AGREGAR', estado: 'VIGENTE', version: (p.ultima?.version ?? 0) + 1 };
}

/**
 * HA-T06: si hubo antes otro profesional en el área de este componente. Es lo que hace aparecer la tarjeta al aceptar a
 * alguien nuevo: otro componente de la persona en la misma área, de otro profesional, que empezó antes que este (aunque ya
 * haya terminado). No mira si dejó datos: decirlo sería contarle a la app algo que la persona no autorizó a mirar.
 */
export function huboOtroAntes(
  este: { readonly profesionalId: string; readonly alcance: Alcance; readonly inicio: string },
  todos: readonly { readonly profesionalId: string; readonly alcance: Alcance; readonly inicio: string }[],
): boolean {
  return todos.some((c) => c.alcance === este.alcance && c.profesionalId !== este.profesionalId && c.inicio < este.inicio);
}

// ─── El período (los tramos de fechas) ──────────────────────────────────────────────────────────────────────────────

/** El tramo que se lee si no se pide otro: los últimos 90 días de la historia anterior. */
export const DIAS_DEL_TRAMO = 90;
/** El tramo más largo que se puede pedir, como el análisis. */
export const DIAS_MAXIMOS_DEL_TRAMO = 366;

const restarDias = (fecha: string, dias: number): string => {
  const d = new Date(`${fecha}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - dias);
  return d.toISOString().slice(0, 10);
};
const sumarDias = (fecha: string, dias: number): string => restarDias(fecha, -dias);

export interface TramoDeFechas {
  readonly desde: string;
  readonly hasta: string;
}

/**
 * El tramo de API-HIA-04, en fechas civiles inclusive (`periodStart`, `periodEnd`). Sin fechas: los últimos 90 días de la
 * historia anterior (`extension`), o los 90 antes del corte si no hay nada. Las dos fechas van juntas, el inicio no puede
 * ser posterior al fin y el tramo no pasa de 366 días. Un error es un 400 con el problema y el parámetro.
 */
export function tramoDeLaHistoriaAnterior(
  pedido: { readonly inicio: unknown; readonly fin: unknown },
  p: { readonly extension: TramoDeFechas | null; readonly fechaDelCorte: string },
): { readonly ok: true; readonly tramo: TramoDeFechas } | { readonly ok: false; readonly issues: readonly { readonly code: string; readonly path: string }[] } {
  const { inicio, fin } = pedido;
  if (inicio === undefined && fin === undefined) {
    const hasta = p.extension?.hasta ?? restarDias(p.fechaDelCorte, 1);
    const desde = restarDias(hasta, DIAS_DEL_TRAMO - 1);
    return { ok: true, tramo: { desde: p.extension && p.extension.desde > desde ? p.extension.desde : desde, hasta } };
  }
  const issues: { code: string; path: string }[] = [];
  if (inicio === undefined) issues.push({ code: 'REQUIRED', path: 'periodStart' });
  else if (!esFechaCivil(inicio)) issues.push({ code: 'INVALID_DATE', path: 'periodStart' });
  if (fin === undefined) issues.push({ code: 'REQUIRED', path: 'periodEnd' });
  else if (!esFechaCivil(fin)) issues.push({ code: 'INVALID_DATE', path: 'periodEnd' });
  if (issues.length > 0) return { ok: false, issues };
  const desde = inicio as string;
  const hasta = fin as string;
  if (desde > hasta) return { ok: false, issues: [{ code: 'INVALID_PERIOD', path: 'periodStart' }] };
  if (diasEntreFechas(desde, hasta) + 1 > DIAS_MAXIMOS_DEL_TRAMO) return { ok: false, issues: [{ code: 'PERIOD_TOO_LONG', path: 'periodEnd' }] };
  return { ok: true, tramo: { desde, hasta } };
}

/** El tramo de antes, del mismo largo, si la historia sigue más atrás; si no, `null`. */
export function tramoAnterior(tramo: TramoDeFechas, extension: TramoDeFechas | null): TramoDeFechas | null {
  if (!extension || !(extension.desde < tramo.desde)) return null;
  const largo = diasEntreFechas(tramo.desde, tramo.hasta) + 1;
  const hasta = restarDias(tramo.desde, 1);
  return { desde: restarDias(hasta, largo - 1), hasta };
}

/** El tramo siguiente, del mismo largo, si la historia sigue más adelante; si no, `null`. */
export function tramoSiguiente(tramo: TramoDeFechas, extension: TramoDeFechas | null): TramoDeFechas | null {
  if (!extension || !(tramo.hasta < extension.hasta)) return null;
  const largo = diasEntreFechas(tramo.desde, tramo.hasta) + 1;
  const desde = diaSiguiente(tramo.hasta);
  return { desde, hasta: sumarDias(desde, largo - 1) };
}

/** Si una vigencia (desde, hasta inclusive o abierta) toca el tramo. */
export const tocaElTramo = (v: { readonly desde: string; readonly hasta: string | null }, tramo: TramoDeFechas): boolean => v.desde <= tramo.hasta && (v.hasta === null || v.hasta >= tramo.desde);

/**
 * Una versión de plan vista desde el corte: si seguía vigente cuando empezó el acompañamiento de quien lee, no se dice
 * hasta cuándo (eso ya no es historia anterior) y se marca; si no, su vigencia tal cual.
 */
export function vigenciaHastaElCorte(v: { readonly desde: string; readonly hasta: string | null; readonly corteEl: string | null }, corte: string): { readonly desde: string; readonly hasta: string | null; readonly seguiaVigente: boolean } {
  const seguia = v.corteEl === null || v.corteEl >= corte;
  return { desde: v.desde, hasta: seguia ? null : v.hasta, seguiaVigente: seguia };
}

/** La extensión de la historia: de la fecha más vieja a la más nueva de todo lo que entra; `null` si no hay nada. */
export function extensionDe(fechas: readonly (string | null | undefined)[]): TramoDeFechas | null {
  const validas = fechas.filter((f): f is string => typeof f === 'string' && esFechaCivil(f)).sort();
  if (validas.length === 0) return null;
  return { desde: validas[0]!, hasta: validas[validas.length - 1]! };
}

// ─── Lo registrado, por período (el website) ────────────────────────────────────────────────────────────────────────

/** Lo registrado, agrupado por semana (de la más nueva a la más vieja), con lo de cada semana en orden de fecha. */
export function porSemana<T extends { readonly date: string }>(registros: readonly T[]): readonly { readonly desde: string; readonly hasta: string; readonly registros: readonly T[] }[] {
  const semanas = new Map<string, T[]>();
  for (const r of [...registros].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))) {
    const lunes = lunesDe(r.date);
    semanas.set(lunes, [...(semanas.get(lunes) ?? []), r]);
  }
  return [...semanas.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).map(([lunes, rs]) => ({ desde: lunes, hasta: sumarDias(lunes, 6), registros: rs }));
}

/** El rótulo del autor en el website: «De otro profesional», con su número solo si hubo más de uno. */
export const rotuloDelAutor = (autor: AutorDeLaHistoriaAnterior, cuantos: number): string => (cuantos > 1 ? COPY_HISTORIA_ANTERIOR.deOtroProfesionalN(autor.ordinal) : COPY_HISTORIA_ANTERIOR.deOtroProfesional);

/** Todos los textos de las pantallas, en una lista: lo que miran las pruebas de vocabulario. */
export function textosDeLaHistoriaAnterior(): readonly string[] {
  const C = COPY_HISTORIA_ANTERIOR;
  const areas: readonly Alcance[] = ['NUTRICION', 'ENTRENAMIENTO', 'ANTROPOMETRIA'];
  return [
    TEXTO_DE_LA_HISTORIA_ANTERIOR.texto,
    ...areas.flatMap((a) => [C.titulo(a), C.explicacion('Lic. Sofía Paz', a), C.interruptorParaLeer('Lic. Sofía Paz', a), C.alAceptar.titulo('Lic. Sofía Paz', a), C.tituloDelArea(a), C.comoPedirla.cuerpo(a)]),
    C.interruptor, C.laVe('3/11/2026'), C.noLaVe, C.enPausa, C.miro('ayer a las 18:20'), C.todaviaNoLaMiro, C.leerElTexto, C.propuesta, C.compartida('Lic. Sofía Paz'), C.retirada('Lic. Sofía Paz'),
    C.confirmarRetiro.titulo, C.confirmarRetiro.cuerpo('Lic. Sofía Paz'), C.confirmarRetiro.confirmar, C.confirmarRetiro.cancelar,
    C.alAceptar.opcional, C.alAceptar.compartir, C.alAceptar.ahoraNo, C.noSePudo, C.cambioAntes, C.sinElA3,
    C.ruta, C.aviso, C.comoPedirla.titulo, C.comoPedirla.sinAcceso, C.deOtroProfesional, C.deOtroProfesionalN(2),
    ...Object.values(C.secciones), ...Object.values(C.vacio), C.sinHistoria, C.tramo('1/9/2026', '29/11/2026'), C.tramoAnterior, C.tramoSiguiente, C.laHistoriaVa('1/3/2026', '29/11/2026'),
    C.version(2), C.vigencia('1/9/2026', null), C.vigencia('1/9/2026', '1/10/2026'), C.seguiaVigente, ...Object.values(C.motivoDelCorte), C.semana('3/11', '9/11'),
    C.comidasRegistradas(1), C.comidasRegistradas(4), C.sesionesRegistradas(1), C.sesionesRegistradas(3), C.opcionDelPlan, C.algoDiferente, C.anulado, C.corregida, C.ejercicios(1), C.ejercicios(5),
    C.metodo('Durnin y Womersley'), C.protocolo('ISAK'), C.calculado, C.resultado, C.fundamento, C.proximaAccion, C.proximaRevision('1/12/2026'), C.periodoRevisado('1/11/2026', '15/11/2026'),
  ];
}
