/**
 * La cinta del tiempo (GR-23; WP-GRAFICOS fase 2, DL-174): lo que pasó en cada momento, arriba de los gráficos y sobre el
 * mismo eje de fechas. La usan «Patrones», el cuadro del ejercicio y los carriles de tipo `EVENTOS`.
 *
 * - Las versiones de los planes van como barras (de las vigencias de API-PRJ-01); las tomas, las sustituciones, las
 *   revisiones, las notas de coordinación y las sesiones con cambios, como íconos con forma y texto (de API-DSH-04 y, las
 *   sustituciones, del registro de cada sesión de API-TRN-21). Los que caen juntos se agrupan («3 hitos»).
 * - Una fila por área y una para las notas: la fila dice el área con su ícono y la lista lo dice con palabras.
 * - Una descarga no se infiere: si no hay dato, no se dibuja. Un hecho de un área sin acceso no llega (la API ya lo
 *   filtra) y, si llegara, tampoco se dibuja como «algo pasó». Una nota de coordinación no es un dato de un área: es una
 *   comunicación dirigida a quien la lee (DL-140), y la API decide quién la ve.
 * - Lo anulado no está: ya no cuenta en ningún gráfico.
 * - Las notas de la persona al finalizar (PG-15) y las propias del profesional (PG-16) entran por `otras` cuando se integre
 *   la tanda B. Los hábitos versionados (SP-08) tienen su lugar reservado y no se dibujan hasta su DL (GR-D10).
 * - La cinta ubica, no explica: nada une un hecho con un cambio de otro gráfico.
 *
 * Es puro: lo prueba `apps/web/test/graficos-base.test.mjs` (TEST-GRF-019).
 */
import {
  compararEjecucion,
  esElMismoEjercicio,
  identidadDeVersiones,
  type Alcance,
  type AreaDeMetrica,
  type ComparacionDeEjercicio,
  type DominioDeAnalisis,
  type EjecucionDeEntrenamiento,
  type EntradaDeLineaDeTiempo,
  type EstadoDeEntrada,
  type NombreDeIcono,
  type TipoDeEvento,
  type VigenciaDePlan,
} from '@be/domain';
import { diaAnterior } from '../seguimiento/geometria';
import type { CarrilDeEventos } from './carriles';
import { textoDeLaMarca, type CursorDeFechas, type EscalaDeFechas } from './eje-de-fechas';

export type TipoDeEventoDeLaCinta =
  | 'VERSION_DE_PLAN'
  | 'TOMA'
  | 'SUSTITUCION'
  | 'REVISION'
  | 'NOTA_DE_COORDINACION'
  /** Una sesión registrada con cambios respecto de lo indicado (`SESSION_WITH_DEVIATION` de API-DSH-04). */
  | 'SESION_CON_CAMBIOS'
  /** PG-15, con la tanda B. */
  | 'NOTA_DE_LA_PERSONA'
  /** PG-16, con la tanda B. */
  | 'NOTA_PROPIA'
  /** SP-08: lugar reservado, no se dibuja hasta su DL (GR-D10). */
  | 'HABITO';

export interface EventoDeLaCinta {
  /** Estable dentro de la cinta: elegir y volver al evento. */
  readonly clave: string;
  readonly tipo: TipoDeEventoDeLaCinta;
  /** El área del hecho; `null` si es de la relación (una nota de coordinación). */
  readonly area: AreaDeMetrica | null;
  readonly desde: string;
  /** Las barras (una versión de un plan) tienen fin; `null` si sigue o si es un hecho de un día. */
  readonly hasta: string | null;
  /** Lo que dice el ícono o la barra: «Plan de entrenamiento v3», «Toma», «3 hitos». */
  readonly rotulo: string;
  /** El detalle de la lectura y la tabla, o `null`. */
  readonly detalle: string | null;
  /** Cuántos hechos agrupa (1 si es uno solo). */
  readonly agrupados: number;
}

/** Los textos de la cinta. Ubican, nunca califican: pasan la guardia de las tres áreas (TEST-GRF-018 y 019). */
export const COPY_DE_LA_CINTA = {
  titulo: 'Lo que pasó en el período',
  comoSeUsa: 'Flechas: el hecho anterior o el siguiente. Inicio y Fin: el primero y el último. Escape: soltar. Lo que elegís se marca en todos los gráficos.',
  lecturaSinElegir: 'Elegí un hecho con las flechas o tocándolo: su fecha o su tramo se marca en todos los gráficos.',
  sinHechos: 'En el período no hay versiones de planes, tomas, revisiones ni notas.',
  verLaLista: 'Ver la lista',
  ocultarLaLista: 'Ocultar la lista',
  leyenda: 'Cómo se leen los hechos',
  queSeReintenta: 'la cinta del tiempo',
  barra: 'Versión de un plan: una barra, desde el día que empezó a regir',
  grupo: 'Varios hechos juntos: un círculo con la cantidad',
  leidaHastaElTope: (n: number) => `Se leyeron los ${n} hechos más recientes del período: los anteriores no están en la cinta.`,
} as const;

// ─── Lo que se lee de API-DSH-04 ────────────────────────────────────────────────────────────────

/**
 * Los tipos de hecho de API-DSH-04 que entran en la cinta. Las sesiones con cambios van en otra lectura
 * (`TRAINING_SESSION_RECORDED` con el rasgo `SESSION_WITH_DEVIATION`): pedirlas todas traería cada sesión del período.
 * Las activaciones de planes no se piden: las versiones salen de las vigencias, con su comienzo y su corte. Los objetivos,
 * los seguimientos y los formularios quedan en la línea de tiempo (GR-T28).
 */
export const TIPOS_DE_HITO_DE_LA_CINTA: readonly TipoDeEvento[] = ['ANTHROPOMETRIC_EVALUATION_RECORDED', 'NUTRITION_REVIEW_RECORDED', 'TRAINING_REVIEW_RECORDED', 'COORDINATION_NOTE_RECORDED'];

/** Los estados que se piden: lo anulado no está en la cinta. */
export const ESTADOS_DE_LA_CINTA: readonly EstadoDeEntrada[] = ['EFFECTIVE', 'RECTIFIED', 'CORRECTED'];

const AREA_DEL_DOMINIO: Readonly<Record<DominioDeAnalisis, AreaDeMetrica>> = { NUTRITION: 'NUTRICION', TRAINING: 'ENTRENAMIENTO', ANTHROPOMETRY: 'ANTROPOMETRIA' };
const ALCANCE_DEL_AREA: Readonly<Record<AreaDeMetrica, Alcance>> = { NUTRICION: 'NUTRICION', ENTRENAMIENTO: 'ENTRENAMIENTO', ANTROPOMETRIA: 'ANTROPOMETRIA' };

/** Los nombres de las áreas, como en el resto del espacio profesional. */
export const NOMBRE_DEL_AREA: Readonly<Record<AreaDeMetrica, string>> = { ENTRENAMIENTO: 'Entrenamiento', NUTRICION: 'Nutrición', ANTROPOMETRIA: 'Antropometría' };
const NOMBRE_DEL_PLAN: Readonly<Record<AreaDeMetrica, string>> = { ENTRENAMIENTO: 'Plan de entrenamiento', NUTRICION: 'Plan nutricional', ANTROPOMETRIA: 'Plan' };

/** Lo que va después de « · » en un título de API-DSH-04 («Sesión registrada · Piernas A» → «Piernas A»). */
function despuesDelPunto(titulo: string): string | null {
  const corte = titulo.indexOf(' · ');
  return corte < 0 ? null : titulo.slice(corte + 3);
}

const detalleDe = (e: EntradaDeLineaDeTiempo, etiqueta: string): string | null => e.details.find((d) => d.label === etiqueta)?.value ?? null;

/** Un hecho de API-DSH-04 como evento de la cinta, o `null` si no va en ella. */
function eventoDeLaEntrada(e: EntradaDeLineaDeTiempo, exerciseKey: string | null): EventoDeLaCinta | null {
  if (e.state === 'ANNULLED') return null;
  const base = { clave: `hecho:${e.timelineEntryId}`, desde: e.occurredDate, hasta: null, agrupados: 1 } as const;
  const area = AREA_DEL_DOMINIO[e.domain];
  switch (e.eventType) {
    case 'ANTHROPOMETRIC_EVALUATION_RECORDED': {
      const protocolo = detalleDe(e, 'Protocolo') ?? detalleDe(e, 'Protocolos');
      return { ...base, tipo: 'TOMA', area, rotulo: 'Toma', detalle: protocolo ? `Protocolo: ${protocolo}` : null };
    }
    case 'NUTRITION_REVIEW_RECORDED':
    case 'TRAINING_REVIEW_RECORDED': {
      const resultado = detalleDe(e, 'Resultado');
      return { ...base, tipo: 'REVISION', area, rotulo: `Revisión de ${NOMBRE_DEL_AREA[area]}`, detalle: resultado ? `Resultado: ${resultado}` : null };
    }
    case 'COORDINATION_NOTE_RECORDED':
      return { ...base, tipo: 'NOTA_DE_COORDINACION', area: null, rotulo: 'Nota de coordinación', detalle: despuesDelPunto(e.title) };
    case 'TRAINING_SESSION_RECORDED':
      if (!e.quality.includes('SESSION_WITH_DEVIATION')) return null;
      // En el cuadro del ejercicio, solo las sesiones en las que estuvo ese ejercicio.
      if (exerciseKey !== null && !e.exerciseKeys.includes(exerciseKey)) return null;
      return { ...base, tipo: 'SESION_CON_CAMBIOS', area, rotulo: 'Sesión con cambios', detalle: despuesDelPunto(e.title) };
    default:
      return null;
  }
}

/** Una versión de un plan como barra: del día que empezó a regir al día anterior al corte (ese día ya rige la siguiente). */
function eventoDeLaVigencia(v: VigenciaDePlan): EventoDeLaCinta {
  const area = AREA_DEL_DOMINIO[v.domain];
  const hasta = v.to === null ? null : v.to > v.from ? diaAnterior(v.to) : v.from;
  return { clave: `version:${v.planVersionId}`, tipo: 'VERSION_DE_PLAN', area, desde: v.from, hasta, rotulo: `${NOMBRE_DEL_PLAN[area]} ${v.label}`, detalle: hasta === null ? 'vigente' : null, agrupados: 1 };
}

/** La clave del ejercicio registrado, con la misma identidad que el selector de «Analizar». */
const claveDelRealizado = (c: ComparacionDeEjercicio): string | null =>
  c.realizado === null ? null : c.identidad === 'otro-ejercicio' && c.realizado.exerciseId ? `e:${c.realizado.exerciseId}` : `v:${c.realizado.exerciseVersionId}`;

/**
 * Las sustituciones del registro de cada sesión: se registró otro ejercicio que el indicado. Otra versión del mismo
 * ejercicio del catálogo no es una sustitución para la cinta. API-DSH-04 no las marca: salen de API-TRN-21 (GR-T28).
 */
function eventosDeSustitucion(ejecuciones: readonly EjecucionDeEntrenamiento[], exerciseKey: string | null): EventoDeLaCinta[] {
  const versiones = identidadDeVersiones(ejecuciones);
  return ejecuciones.flatMap((x) =>
    compararEjecucion(x, versiones).flatMap((c): EventoDeLaCinta[] => {
      if (!c.sustituido || c.realizado === null || esElMismoEjercicio(c.identidad)) return [];
      if (exerciseKey !== null && `e:${c.prescripto.exerciseId}` !== exerciseKey && claveDelRealizado(c) !== exerciseKey) return [];
      return [{ clave: `sustitucion:${c.executionId}:${c.prescriptionId}`, tipo: 'SUSTITUCION', area: 'ENTRENAMIENTO', desde: c.fecha, hasta: null, rotulo: 'Sustitución', detalle: `Se registró ${c.realizado.nombre} en lugar de ${c.prescripto.nombre}`, agrupados: 1 }];
    }),
  );
}

export interface FuentesDeLaCinta {
  /** Lo que el PDP dejó leer con esta persona hoy: un hecho de otra área no se dibuja, aunque llegue. */
  readonly alcances: readonly Alcance[];
  /** API-DSH-04: los hitos de la cinta y las sesiones con cambios. */
  readonly entradas: readonly EntradaDeLineaDeTiempo[];
  /** Las vigencias de los planes propios (API-PRJ-01, las de `leerDisponibles`). */
  readonly vigencias: readonly VigenciaDePlan[];
  /** Las sesiones de API-TRN-21, si quien usa la cinta ya las leyó: de ahí salen las sustituciones. */
  readonly ejecuciones?: readonly EjecucionDeEntrenamiento[];
  /** Otras fuentes: las notas de la tanda B (PG-15 y PG-16). */
  readonly otras?: readonly EventoDeLaCinta[];
  /** En el cuadro del ejercicio: las sesiones con cambios y las sustituciones de ese ejercicio solamente. */
  readonly exerciseKey?: string | null;
}

const ORDEN_DEL_TIPO: readonly TipoDeEventoDeLaCinta[] = ['VERSION_DE_PLAN', 'TOMA', 'REVISION', 'SESION_CON_CAMBIOS', 'SUSTITUCION', 'NOTA_DE_COORDINACION', 'NOTA_DE_LA_PERSONA', 'NOTA_PROPIA', 'HABITO'];

/** Los eventos de la cinta, ordenados por fecha. Nada de un área sin acceso; ningún hábito hasta su DL (GR-D10). */
export function eventosDeLaCinta(f: FuentesDeLaCinta): EventoDeLaCinta[] {
  const exerciseKey = f.exerciseKey ?? null;
  const permitido = (e: EventoDeLaCinta): boolean => e.tipo !== 'HABITO' && (e.area === null || f.alcances.includes(ALCANCE_DEL_AREA[e.area]));
  const todos = [
    ...f.vigencias.map(eventoDeLaVigencia),
    ...f.entradas.flatMap((e) => {
      const evento = eventoDeLaEntrada(e, exerciseKey);
      return evento ? [evento] : [];
    }),
    ...(f.ejecuciones ? eventosDeSustitucion(f.ejecuciones, exerciseKey) : []),
    ...(f.otras ?? []),
  ].filter(permitido);
  const vistos = new Set<string>();
  return todos
    .filter((e) => !vistos.has(e.clave) && Boolean(vistos.add(e.clave)))
    .sort((a, b) => (a.desde < b.desde ? -1 : a.desde > b.desde ? 1 : ORDEN_DEL_TIPO.indexOf(a.tipo) - ORDEN_DEL_TIPO.indexOf(b.tipo) || a.clave.localeCompare(b.clave)));
}

/** La cinta como carril de `PanelesAlineados` (debajo de los paneles del cuadro del ejercicio, por ejemplo). */
export const carrilDeLaCinta = (eventos: readonly EventoDeLaCinta[], nombre: string = COPY_DE_LA_CINTA.titulo): CarrilDeEventos => ({ tipo: 'EVENTOS', id: 'cinta-del-tiempo', nombre, eventos });

// ─── La geometría ───────────────────────────────────────────────────────────────────────────────

/** Una fila por área y una para las notas, en este orden (GR-T29). */
export type FilaDeLaCinta = AreaDeMetrica | 'NOTAS';
export const FILAS_DE_LA_CINTA: readonly FilaDeLaCinta[] = ['ENTRENAMIENTO', 'NUTRICION', 'ANTROPOMETRIA', 'NOTAS'];
export const filaDelEvento = (e: Pick<EventoDeLaCinta, 'area'>): FilaDeLaCinta => e.area ?? 'NOTAS';
export const NOMBRE_DE_LA_FILA: Readonly<Record<FilaDeLaCinta, string>> = { ...NOMBRE_DEL_AREA, NOTAS: 'Notas' };

/** El alto de una fila: el ícono de 15 px arriba y la barra de las versiones abajo, sin pisarse. */
export const ALTO_DE_LA_FILA_DE_LA_CINTA = 26;
/** Dónde va el centro del ícono y dónde la barra, desde el borde de arriba de la fila. */
export const CENTRO_DEL_ICONO = 10;
export const BARRA_DESDE = 20;
export const ALTO_DE_LA_BARRA = 4;
/** Dos íconos más cerca que esto se agrupan: un ícono mide 15 px. */
export const SEPARACION_MINIMA_DE_HECHOS = 18;
/** El ancho aproximado de una letra de 12,5 px, para saber si un rótulo entra. */
const ANCHO_DE_UNA_LETRA = 7;

/** Lo que se agrupa sigue siendo un hito si todos lo son; con una sesión o una sustitución, son hechos. */
const SON_HITOS: ReadonlySet<TipoDeEventoDeLaCinta> = new Set<TipoDeEventoDeLaCinta>(['VERSION_DE_PLAN', 'TOMA', 'REVISION', 'NOTA_DE_COORDINACION', 'NOTA_PROPIA']);

export interface BarraDeLaCinta {
  readonly clave: string;
  readonly x1: number;
  readonly x2: number;
  readonly evento: EventoDeLaCinta;
  /** El rótulo que entra al comienzo de la barra sin pisar un ícono («Plan de entrenamiento v3» o «v3»), o `null`. */
  readonly texto: string | null;
}

export interface HechoDeLaCinta {
  readonly clave: string;
  readonly x: number;
  /** El evento, o el grupo que arma cuando hay varios juntos («3 hitos»). */
  readonly evento: EventoDeLaCinta;
  readonly hechos: readonly EventoDeLaCinta[];
}

export interface FilaUbicadaDeLaCinta {
  readonly fila: FilaDeLaCinta;
  /** El borde de arriba de la fila. */
  readonly y: number;
  readonly barras: readonly BarraDeLaCinta[];
  readonly hechos: readonly HechoDeLaCinta[];
}

export interface GeometriaDeLaCinta {
  readonly filas: readonly FilaUbicadaDeLaCinta[];
  readonly alto: number;
}

const textoCorto = (e: EventoDeLaCinta): string => `${textoDeLaMarca(e.desde)} · ${e.rotulo}`;

function grupoDe(hechos: readonly EventoDeLaCinta[]): EventoDeLaCinta {
  const primero = hechos[0] as EventoDeLaCinta;
  const ultimo = hechos[hechos.length - 1] as EventoDeLaCinta;
  const cuantos = hechos.reduce((n, h) => n + h.agrupados, 0);
  const hitos = hechos.every((h) => SON_HITOS.has(h.tipo));
  return {
    clave: `grupo:${primero.clave}`,
    tipo: primero.tipo,
    area: primero.area,
    desde: primero.desde,
    hasta: ultimo.desde !== primero.desde ? ultimo.desde : null,
    rotulo: `${cuantos} ${hitos ? 'hitos' : 'hechos'}`,
    detalle: hechos.map(textoCorto).join('; '),
    agrupados: cuantos,
  };
}

/**
 * Los hechos de una fila, agrupados cuando caen a menos de `separacion` píxeles del primero del grupo: dos íconos no se
 * pisan, y el grupo dice cuántos son y cuáles en su detalle (la lista y la lectura los nombran uno por uno).
 */
export function agruparHechos(eventos: readonly EventoDeLaCinta[], xDe: (e: EventoDeLaCinta) => number, separacion: number = SEPARACION_MINIMA_DE_HECHOS): HechoDeLaCinta[] {
  const ordenados = [...eventos].sort((a, b) => xDe(a) - xDe(b) || a.clave.localeCompare(b.clave));
  const grupos: { x: number; hechos: EventoDeLaCinta[] }[] = [];
  for (const e of ordenados) {
    const x = xDe(e);
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && x - ultimo.x < separacion) ultimo.hechos.push(e);
    else grupos.push({ x, hechos: [e] });
  }
  return grupos.map((g) => {
    const solo = g.hechos.length === 1 ? (g.hechos[0] as EventoDeLaCinta) : null;
    const evento = solo ?? grupoDe(g.hechos);
    return { clave: evento.clave, x: g.x, evento, hechos: g.hechos };
  });
}

const esBarra = (e: EventoDeLaCinta): boolean => e.tipo === 'VERSION_DE_PLAN';

/**
 * El rótulo de una barra que entra entre su comienzo, su fin y el primer ícono de la fila que tiene adelante (o encima de
 * su comienzo): el rótulo va a la altura de los íconos y no los pisa.
 */
function textoDeLaBarra(e: EventoDeLaCinta, x1: number, x2: number, hechos: readonly HechoDeLaCinta[]): string | null {
  const tope = Math.min(x2, ...hechos.filter((h) => h.x >= x1 - 9).map((h) => h.x - 9));
  const lugar = tope - x1 - 6;
  const corto = e.rotulo.split(' ').at(-1) ?? e.rotulo;
  for (const texto of [e.rotulo, corto]) if (texto.length * ANCHO_DE_UNA_LETRA <= lugar) return texto;
  return null;
}

/** La geometría de la cinta sobre la escala de fechas común: solo las filas que tienen algo en el período. */
export function geometriaDeLaCinta(
  eventos: readonly EventoDeLaCinta[],
  escala: Pick<EscalaDeFechas, 'x' | 'porDia' | 'desde' | 'hasta'>,
  altoDeLaFila: number = ALTO_DE_LA_FILA_DE_LA_CINTA,
): GeometriaDeLaCinta {
  const filas: FilaUbicadaDeLaCinta[] = [];
  for (const fila of FILAS_DE_LA_CINTA) {
    const deLaFila = eventos.filter((e) => filaDelEvento(e) === fila && e.tipo !== 'HABITO');
    const puntuales = deLaFila.filter((e) => !esBarra(e) && e.desde >= escala.desde && e.desde <= escala.hasta);
    const hechos = agruparHechos(puntuales, (e) => escala.x(e.desde));
    const barras = deLaFila.filter(esBarra).flatMap((e): BarraDeLaCinta[] => {
      const fin = e.hasta ?? escala.hasta;
      if (fin < escala.desde || e.desde > escala.hasta) return [];
      const x1 = escala.x(e.desde < escala.desde ? escala.desde : e.desde) - escala.porDia / 2 + 1;
      const x2 = Math.max(x1 + 2, escala.x(fin > escala.hasta ? escala.hasta : fin) + escala.porDia / 2 - 1);
      return [{ clave: e.clave, x1, x2, evento: e, texto: textoDeLaBarra(e, x1, x2, hechos) }];
    });
    if (barras.length === 0 && hechos.length === 0) continue;
    filas.push({ fila, y: filas.length * altoDeLaFila, barras, hechos });
  }
  return { filas, alto: filas.length * altoDeLaFila };
}

// ─── Elegir con el teclado y con el puntero ─────────────────────────────────────────────────────

/** Lo que se puede elegir en la cinta: una barra o un hecho (o un grupo), en el orden del tiempo. */
export interface ElegibleDeLaCinta {
  readonly clave: string;
  readonly fila: FilaDeLaCinta;
  /** El centro, para el aro del foco y para elegir con el puntero. */
  readonly x: number;
  readonly y: number;
  readonly evento: EventoDeLaCinta;
  readonly hechos: readonly EventoDeLaCinta[];
  readonly barra: { readonly x1: number; readonly x2: number } | null;
}

export function elegiblesDeLaCinta(g: GeometriaDeLaCinta): ElegibleDeLaCinta[] {
  const todos = g.filas.flatMap((f): ElegibleDeLaCinta[] => [
    ...f.barras.map((b) => ({ clave: b.clave, fila: f.fila, x: b.x1, y: f.y + BARRA_DESDE + ALTO_DE_LA_BARRA / 2, evento: b.evento, hechos: [b.evento], barra: { x1: b.x1, x2: b.x2 } })),
    ...f.hechos.map((h) => ({ clave: h.clave, fila: f.fila, x: h.x, y: f.y + CENTRO_DEL_ICONO, evento: h.evento, hechos: h.hechos, barra: null })),
  ]);
  return todos.sort((a, b) => a.x - b.x || FILAS_DE_LA_CINTA.indexOf(a.fila) - FILAS_DE_LA_CINTA.indexOf(b.fila));
}

/** El elegible al moverse con una tecla, o `null` si la tecla no es de la cinta. Escape suelta (-1). */
export function moverEnLaCinta(cantidad: number, actual: number | null, tecla: string): number | null {
  if (tecla === 'Escape') return actual === null ? null : -1;
  if (cantidad === 0) return null;
  if (tecla === 'Home') return 0;
  if (tecla === 'End') return cantidad - 1;
  if (tecla === 'ArrowRight' || tecla === 'ArrowDown') return actual === null ? 0 : Math.min(actual + 1, cantidad - 1);
  if (tecla === 'ArrowLeft' || tecla === 'ArrowUp') return actual === null ? cantidad - 1 : Math.max(actual - 1, 0);
  return null;
}

/** El elegible bajo el puntero: un ícono a menos de 12 px, o la barra que pasa por ahí, en la fila tocada. */
export function elegibleEn(elegibles: readonly ElegibleDeLaCinta[], g: GeometriaDeLaCinta, x: number, y: number, altoDeLaFila: number = ALTO_DE_LA_FILA_DE_LA_CINTA): number | null {
  const fila = g.filas.find((f) => y >= f.y && y < f.y + altoDeLaFila);
  if (!fila) return null;
  let mejor = -1;
  let distancia = 12;
  for (let i = 0; i < elegibles.length; i++) {
    const e = elegibles[i] as ElegibleDeLaCinta;
    if (e.fila !== fila.fila || e.barra !== null) continue;
    const d = Math.abs(e.x - x);
    if (d < distancia) {
      distancia = d;
      mejor = i;
    }
  }
  if (mejor >= 0) return mejor;
  const barra = elegibles.findIndex((e) => e.fila === fila.fila && e.barra !== null && x >= e.barra.x1 && x <= e.barra.x2);
  return barra >= 0 ? barra : null;
}

/** Los eventos que tocan el período: una versión que sigue vigente llega hasta el final del eje. */
export function eventosEnElPeriodo(eventos: readonly EventoDeLaCinta[], desde: string, hasta: string): EventoDeLaCinta[] {
  return eventos.filter((e) => e.tipo !== 'HABITO' && e.desde <= hasta && (e.hasta ?? (esBarra(e) ? hasta : e.desde)) >= desde);
}

/**
 * Lo que la cinta dice de una fecha elegida en cualquier gráfico de la página: qué versiones regían ese día y qué pasó
 * ese día. Ubica, no explica: no dice que una cosa tenga que ver con otra.
 */
export function loQueRigeEnLaFecha(eventos: readonly EventoDeLaCinta[], fecha: string): string[] {
  return eventos.flatMap((e) => {
    if (e.tipo === 'HABITO') return [];
    if (esBarra(e)) return e.desde <= fecha && (e.hasta === null || e.hasta >= fecha) ? [`rige ${e.rotulo}`] : [];
    return e.desde === fecha ? [`${e.rotulo}${e.detalle ? ` (${e.detalle})` : ''}`] : [];
  });
}

/** Lo que elige un evento en el cursor compartido: su tramo si dura más de un día, o su fecha. */
export function cursorDelEvento(e: EventoDeLaCinta, hastaDelEje: string): CursorDeFechas {
  const hasta = e.hasta ?? (esBarra(e) ? hastaDelEje : null);
  return hasta !== null && hasta !== e.desde ? { fecha: e.desde, tramo: { desde: e.desde, hasta } } : { fecha: e.desde, tramo: null };
}

// ─── Los textos ─────────────────────────────────────────────────────────────────────────────────

/** Lo que dice la lista y la lectura de un evento: «3/11 · Antropometría · Toma (Protocolo: ISAK)». */
export function textoDelEvento(e: EventoDeLaCinta): string {
  const cuando =
    e.hasta !== null ? `Del ${textoDeLaMarca(e.desde)} al ${textoDeLaMarca(e.hasta)}` : esBarra(e) ? `Desde el ${textoDeLaMarca(e.desde)}` : textoDeLaMarca(e.desde);
  if (e.agrupados > 1) return `${cuando} · ${e.rotulo}: ${e.detalle ?? ''}`;
  const area = e.area === null ? null : NOMBRE_DEL_AREA[e.area];
  return [cuando, area, `${e.rotulo}${e.detalle ? ` (${e.detalle})` : ''}`].filter((x): x is string => x !== null).join(' · ');
}

const EN_LA_CUENTA: Readonly<Record<TipoDeEventoDeLaCinta, readonly [string, string]>> = {
  VERSION_DE_PLAN: ['versión de un plan', 'versiones de planes'],
  TOMA: ['toma', 'tomas'],
  REVISION: ['revisión', 'revisiones'],
  SESION_CON_CAMBIOS: ['sesión con cambios', 'sesiones con cambios'],
  SUSTITUCION: ['sustitución', 'sustituciones'],
  NOTA_DE_COORDINACION: ['nota de coordinación', 'notas de coordinación'],
  NOTA_DE_LA_PERSONA: ['nota de la persona', 'notas de la persona'],
  NOTA_PROPIA: ['nota propia', 'notas propias'],
  HABITO: ['hábito', 'hábitos'],
};

/** El resumen en texto, para el lector de pantalla: «2 versiones de planes, 3 tomas y 1 revisión.». */
export function resumenDeLaCinta(eventos: readonly EventoDeLaCinta[]): string {
  const partes = ORDEN_DEL_TIPO.flatMap((tipo) => {
    const n = eventos.filter((e) => e.tipo === tipo).reduce((t, e) => t + e.agrupados, 0);
    return n === 0 || tipo === 'HABITO' ? [] : [`${n} ${EN_LA_CUENTA[tipo][n === 1 ? 0 : 1]}`];
  });
  if (partes.length === 0) return COPY_DE_LA_CINTA.sinHechos;
  return `${partes.length === 1 ? partes[0] : `${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}`}.`;
}

/** El ícono de cada hecho, de la familia de BE: la forma dice qué es, además del texto de la lista y de la lectura. */
export const ICONO_DEL_HECHO: Readonly<Record<Exclude<TipoDeEventoDeLaCinta, 'VERSION_DE_PLAN' | 'HABITO'>, NombreDeIcono>> = {
  TOMA: 'medido',
  REVISION: 'revision',
  SESION_CON_CAMBIOS: 'desvio',
  SUSTITUCION: 'comparar',
  NOTA_DE_COORDINACION: 'texto',
  NOTA_DE_LA_PERSONA: 'persona',
  NOTA_PROPIA: 'texto',
};

/** El ícono de cada fila, en el margen izquierdo. */
export const ICONO_DE_LA_FILA: Readonly<Record<FilaDeLaCinta, NombreDeIcono>> = { ENTRENAMIENTO: 'entrenamiento', NUTRICION: 'nutricion', ANTROPOMETRIA: 'antropometria', NOTAS: 'texto' };

/** Lo que dice cada ícono en la leyenda. */
export const SENTIDO_DEL_HECHO: Readonly<Record<keyof typeof ICONO_DEL_HECHO, string>> = {
  TOMA: 'Toma',
  REVISION: 'Revisión',
  SESION_CON_CAMBIOS: 'Sesión registrada con cambios',
  SUSTITUCION: 'Sustitución de un ejercicio',
  NOTA_DE_COORDINACION: 'Nota de coordinación',
  NOTA_DE_LA_PERSONA: 'Nota de la persona',
  NOTA_PROPIA: 'Nota propia',
};
