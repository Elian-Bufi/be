/**
 * Los tiempos de una sesión de entrenamiento (WP-ENTRENAMIENTO-SERIES; DL-124), con lo que se puede afirmar y con qué
 * certeza. La semántica es la de `DECISIONES_Y_TIEMPOS.md` del paquete de Dirección del 2026-10-06:
 * - **Sesión:** el tiempo transcurrido va del inicio al fin explícitos. «Sin pausas» descuenta las pausas declaradas. No
 *   son minutos de esfuerzo físico.
 * - **Ejercicio:** es la unión de los tramos en que ese ejercicio estuvo activo, dentro de la sesión y sin las pausas.
 *   Incluye descansos y carga de datos, y no es tiempo bajo tensión. Lo que no tuvo un ejercicio activo se conserva aparte.
 * - **Descanso:** inicio y fin explícitos, ligados a la serie que lo originó. Se informa la diferencia con el objetivo sin
 *   juzgarla.
 * - **Serie:** solo un par válido de inicio y fin da una «duración medida». Sin ese par, la duración es desconocida,
 *   aunque la serie tenga datos registrados.
 * - **Calidad:**
 *   - `MEDIDO`: los dos extremos se tomaron con el reloj monotónico del mismo proceso, con la misma ancla, y el reloj
 *     civil no avanzó bastante más que él (ver `TOLERANCIA_ENTRE_RELOJES_MS`);
 *   - `ESTIMADO`: se reconstruyó con el reloj civil, por ejemplo después de reiniciar la app, o uno de los extremos lo
 *     declaró la persona al resolver una medición abierta;
 *   - `INCOMPLETO`: hay inicio pero no fin. Nunca se cierra a la hora de reapertura;
 *   - `SIN_DATO`: no hay inicio;
 *   - `INVALIDO`: el fin es anterior al inicio.
 * - Los intervalos son semiabiertos, [inicio, fin), y la resolución interna es el milisegundo. Se redondea solo al
 *   mostrar.
 * - Los descansos están dentro del total de la sesión y del tiempo del ejercicio: no se suman de nuevo.
 * Es lógica pura, sin reloj propio: quien llama pasa los instantes. Así se prueba con un reloj inyectable.
 */

export type CalidadDeTiempo = 'MEDIDO' | 'ESTIMADO' | 'INCOMPLETO' | 'SIN_DATO' | 'INVALIDO';

/**
 * Cómo se tomó el instante de un evento:
 * - `MONOTONICO`: en el proceso de la app, con su reloj monotónico;
 * - `RELOJ_CIVIL_RECUPERADO`: reconstruido con el reloj civil, sin un monotónico confiable;
 * - `DECLARADO`: la persona declaró ese momento al resolver una medición que quedó abierta («terminó ahora»). Es una
 *   declaración, no una medición.
 */
export type OrigenDelInstante = 'MONOTONICO' | 'RELOJ_CIVIL_RECUPERADO' | 'DECLARADO';

/**
 * Cuánto puede adelantarse el reloj civil al monotónico dentro de una misma medición sin que deje de ser «medida».
 * En Android, el reloj monotónico que lee la app (CLOCK_MONOTONIC) no avanza mientras el teléfono duerme. Si el civil
 * avanzó bastante más, pudo haber pasado eso o alguien adelantó la hora: no se puede saber cuál, así que la duración
 * sale del reloj civil y es `ESTIMADO`. Si el civil avanzó menos (alguien atrasó la hora), el monotónico sigue siendo
 * válido y la duración es `MEDIDO`.
 */
export const TOLERANCIA_ENTRE_RELOJES_MS = 2000;

/**
 * Un instante de un evento de tiempo. `civilMs` es el reloj civil, que sirve para recuperar y sincronizar. Si el evento
 * se midió en el proceso de la app, `monotonico` lleva el reloj monotónico con el ancla de ese proceso, que cambia al
 * reiniciar.
 */
export interface InstanteDeEvento {
  readonly civilMs: number;
  readonly monotonico: { readonly ancla: string; readonly ms: number } | null;
  readonly origen: OrigenDelInstante;
}

export interface DuracionCalculada {
  /** Milisegundos, o `null` si no se puede afirmar una duración. */
  readonly ms: number | null;
  readonly calidad: CalidadDeTiempo;
}

/**
 * La duración entre dos instantes, con su calidad.
 * - Sin inicio: `SIN_DATO`, aunque haya un registro al final, como la serie A3 del ejemplo.
 * - Sin fin: `INCOMPLETO`. No se inventa un fin fisiológico ni se cierra al reabrir la app.
 * - Si los dos tienen monotónico con la misma ancla, la duración es monotónica y `MEDIDO`, aunque el reloj civil haya
 *   retrocedido entre los dos. Si el civil se adelantó más que la tolerancia, el teléfono pudo haber dormido: la
 *   duración sale del civil y es `ESTIMADO`.
 * - Si no, la duración sale del reloj civil y es `ESTIMADO`.
 * - Una duración negativa es `INVALIDO`.
 */
export function duracionDeIntervalo(inicio: InstanteDeEvento | null, fin: InstanteDeEvento | null): DuracionCalculada {
  if (!inicio) return { ms: null, calidad: 'SIN_DATO' };
  if (!fin) return { ms: null, calidad: 'INCOMPLETO' };
  const mismoProceso =
    inicio.origen === 'MONOTONICO' && fin.origen === 'MONOTONICO' && inicio.monotonico !== null && fin.monotonico !== null && inicio.monotonico.ancla === fin.monotonico.ancla;
  const civil = fin.civilMs - inicio.civilMs;
  if (mismoProceso) {
    const monotonico = fin.monotonico!.ms - inicio.monotonico!.ms;
    if (!Number.isFinite(monotonico) || monotonico < 0) return { ms: null, calidad: 'INVALIDO' };
    if (Number.isFinite(civil) && civil - monotonico > TOLERANCIA_ENTRE_RELOJES_MS) return { ms: civil, calidad: 'ESTIMADO' };
    return { ms: monotonico, calidad: 'MEDIDO' };
  }
  if (!Number.isFinite(civil) || civil < 0) return { ms: null, calidad: 'INVALIDO' };
  return { ms: civil, calidad: 'ESTIMADO' };
}

// ─── Intervalos en una misma línea de tiempo ─────────────────────────────────────────────────────

/** Un intervalo semiabierto [inicio, fin), en milisegundos de una misma línea de tiempo. */
export interface Intervalo {
  readonly inicio: number;
  readonly fin: number;
}

/** La unión de intervalos, ordenada y sin solapamientos. Los vacíos o invertidos se descartan. */
export function unionDeIntervalos(intervalos: readonly Intervalo[]): Intervalo[] {
  const ordenados = intervalos.filter((i) => Number.isFinite(i.inicio) && Number.isFinite(i.fin) && i.fin > i.inicio).sort((a, b) => a.inicio - b.inicio);
  const union: Intervalo[] = [];
  for (const i of ordenados) {
    const ultimo = union[union.length - 1];
    if (ultimo && i.inicio <= ultimo.fin) union[union.length - 1] = { inicio: ultimo.inicio, fin: Math.max(ultimo.fin, i.fin) };
    else union.push({ ...i });
  }
  return union;
}

/** La suma de las duraciones de una unión. */
const sumar = (intervalos: readonly Intervalo[]) => unionDeIntervalos(intervalos).reduce((total, i) => total + (i.fin - i.inicio), 0);

/** La intersección de dos uniones. */
function interseccion(a: readonly Intervalo[], b: readonly Intervalo[]): Intervalo[] {
  const salida: Intervalo[] = [];
  for (const x of unionDeIntervalos(a)) for (const y of unionDeIntervalos(b)) {
    const inicio = Math.max(x.inicio, y.inicio);
    const fin = Math.min(x.fin, y.fin);
    if (fin > inicio) salida.push({ inicio, fin });
  }
  return unionDeIntervalos(salida);
}

/** `a` sin lo que cubre `b`. */
function diferencia(a: readonly Intervalo[], b: readonly Intervalo[]): Intervalo[] {
  let resto = unionDeIntervalos(a);
  for (const y of unionDeIntervalos(b)) {
    resto = resto.flatMap((x) => {
      if (y.fin <= x.inicio || y.inicio >= x.fin) return [x];
      const partes: Intervalo[] = [];
      if (y.inicio > x.inicio) partes.push({ inicio: x.inicio, fin: y.inicio });
      if (y.fin < x.fin) partes.push({ inicio: y.fin, fin: x.fin });
      return partes;
    });
  }
  return resto;
}

// ─── La sesión ───────────────────────────────────────────────────────────────────────────────────

export interface TramoDeEjercicio {
  /** La identidad del ejercicio de la prescripción (no su nombre): volver al mismo ejercicio acumula. */
  readonly ejercicio: string;
  readonly inicio: number;
  /** `null`: siguió activo hasta el fin de la sesión, o hasta el próximo cambio de ejercicio. */
  readonly fin: number | null;
}

export interface SesionParaResumir {
  readonly inicio: number;
  readonly fin: number;
  /** Las pausas declaradas; una abierta se cierra al fin de la sesión, que es la acción explícita que la termina. */
  readonly pausas: readonly { readonly inicio: number; readonly fin: number | null }[];
  readonly tramos: readonly TramoDeEjercicio[];
}

export interface ResumenDeSesion {
  readonly transcurridoMs: number;
  readonly pausasMs: number;
  readonly sinPausasMs: number;
  /** Por ejercicio: la unión de sus tramos, dentro de la sesión y sin las pausas. */
  readonly porEjercicioMs: Readonly<Record<string, number>>;
  /** Lo que, sin pausas, no tuvo un ejercicio activo. */
  readonly sinEjercicioMs: number;
}

/**
 * El resumen de una sesión terminada. La suma de los ejercicios más lo que no tuvo ejercicio da la sesión sin pausas.
 * Un tramo abierto se cierra en el próximo cambio de ejercicio o en el fin de la sesión: activar otro ejercicio o
 * finalizar son las acciones explícitas que lo cierran.
 */
export function resumenDeSesion(sesion: SesionParaResumir): ResumenDeSesion {
  const total: Intervalo = { inicio: sesion.inicio, fin: sesion.fin };
  const transcurridoMs = Math.max(0, sesion.fin - sesion.inicio);
  const pausas = interseccion(
    sesion.pausas.map((p) => ({ inicio: p.inicio, fin: p.fin ?? sesion.fin })),
    [total],
  );
  const pausasMs = sumar(pausas);
  const activa = diferencia([total], pausas);
  const tramos = [...sesion.tramos].sort((a, b) => a.inicio - b.inicio);
  const porEjercicio = new Map<string, Intervalo[]>();
  tramos.forEach((t, i) => {
    const fin = t.fin ?? tramos.slice(i + 1).find((s) => s.inicio >= t.inicio)?.inicio ?? sesion.fin;
    porEjercicio.set(t.ejercicio, [...(porEjercicio.get(t.ejercicio) ?? []), { inicio: t.inicio, fin }]);
  });
  const porEjercicioMs: Record<string, number> = {};
  let conEjercicio: Intervalo[] = [];
  for (const [ejercicio, intervalos] of porEjercicio) {
    const dentro = interseccion(intervalos, activa);
    porEjercicioMs[ejercicio] = sumar(dentro);
    conEjercicio = unionDeIntervalos([...conEjercicio, ...dentro]);
  }
  const sinPausasMs = transcurridoMs - pausasMs;
  return { transcurridoMs, pausasMs, sinPausasMs, porEjercicioMs, sinEjercicioMs: sinPausasMs - sumar(conEjercicio) };
}

// ─── El descanso ─────────────────────────────────────────────────────────────────────────────────

export interface DescansoCalculado extends DuracionCalculada {
  readonly objetivoMs: number | null;
  /** Lo registrado menos lo recomendado. Es neutral: ni cumplimiento ni falta. `null` sin objetivo o sin duración. */
  readonly diferenciaMs: number | null;
}

/** Un descanso: su duración, su calidad y la diferencia con el recomendado histórico de esa serie. */
export function descansoCalculado(inicio: InstanteDeEvento | null, fin: InstanteDeEvento | null, objetivoSegundos: number | null): DescansoCalculado {
  const duracion = duracionDeIntervalo(inicio, fin);
  const objetivoMs = objetivoSegundos === null ? null : objetivoSegundos * 1000;
  return { ...duracion, objetivoMs, diferenciaMs: duracion.ms === null || objetivoMs === null ? null : duracion.ms - objetivoMs };
}

// ─── Eventos repetidos ───────────────────────────────────────────────────────────────────────────

/**
 * Los eventos con su identidad: un reintento con el mismo evento no suma tiempo; el mismo identificador con otro contenido
 * es un conflicto, no un reemplazo silencioso. Conserva el primero de cada identidad, en orden.
 */
export function deduplicarEventos<E extends { readonly id: string }>(eventos: readonly E[], mismoContenido: (a: E, b: E) => boolean): { readonly unicos: E[]; readonly conflictos: { readonly id: string; readonly primero: E; readonly otro: E }[] } {
  const vistos = new Map<string, E>();
  const unicos: E[] = [];
  const conflictos: { id: string; primero: E; otro: E }[] = [];
  for (const e of eventos) {
    const previo = vistos.get(e.id);
    if (!previo) {
      vistos.set(e.id, e);
      unicos.push(e);
    } else if (!mismoContenido(previo, e)) conflictos.push({ id: e.id, primero: previo, otro: e });
  }
  return { unicos, conflictos };
}

// ─── Mostrar ─────────────────────────────────────────────────────────────────────────────────────

/** «01:45» o «1:05:00»: una duración, redondeada al segundo solo para mostrarla. `null` no se muestra como cero. */
export function duracionParaMostrar(ms: number | null): string | null {
  if (ms === null || !Number.isFinite(ms)) return null;
  const total = Math.round(Math.abs(ms) / 1000);
  const horas = Math.floor(total / 3600);
  const minutos = Math.floor((total % 3600) / 60);
  const segundos = total % 60;
  const dos = (n: number) => String(n).padStart(2, '0');
  return horas > 0 ? `${horas}:${dos(minutos)}:${dos(segundos)}` : `${dos(minutos)}:${dos(segundos)}`;
}

/** «+00:15» o «−00:30»: la diferencia con el recomendado, sin juicio. `null` si no hay objetivo o duración. */
export function diferenciaParaMostrar(ms: number | null): string | null {
  if (ms === null || !Number.isFinite(ms)) return null;
  const signo = Math.round(ms / 1000) > 0 ? '+' : Math.round(ms / 1000) < 0 ? '−' : '±';
  return `${signo}${duracionParaMostrar(ms)}`;
}
