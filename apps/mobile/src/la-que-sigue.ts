/**
 * PG-01 de WP-PULIDO-GRANDES (DL-173, con PG-D1 decidida por Dirección el 2026-11-13): con un plan de varias sesiones y
 * sin días, Inicio muestra una sola tarjeta con la sesión que sigue en el orden del plan, y «Otra sesión» abre la lista
 * de todas. Es lógica pura: la usan la tarjeta (`pantallas/inicio-entrenamiento.tsx`) y su prueba
 * (`la-que-sigue.test.ts`, TEST-PG-001).
 *
 * - **El orden es el del plan**, el que armó el profesional (API-TRN-14 devuelve las sesiones en ese orden). BE no elige
 *   por la hora, por el día de la semana ni por lo que «convendría»: sigue el orden y lo dice («Sigue en tu plan»).
 * - **La que sigue** es la siguiente a la última realizada (también con desvío) de los últimos 30 días, con la condición
 *   que rige después de las correcciones; después de la última del plan, la primera. Sin ninguna realizada, la primera.
 *   Una sesión registrada «sin realizar» no corre el orden: la persona no la hizo (PG-T1, a ratificar).
 * - **Sin poder leer lo registrado,** no se afirma nada: la tarjeta dice «La primera de tu plan», no «Sigue».
 * - **La hoja** lista todas las sesiones en el orden del plan, con el mismo peso, y el estado de cada una en la semana
 *   (desde el lunes): «Realizada el martes» o «Sin registrar esta semana». Lo no hecho queda neutro.
 */
import { registroVigente, type EjecucionDeEntrenamiento, type HistorialDeEntrenamientoResponse, type Resultado } from '@be/domain';
import { diaDeLaSemana } from './formato';
import { TEXTOS_DEL_PULIDO as T } from './textos-del-pulido';

/** Lo que la tarjeta necesita de una sesión registrada: cuál, cuándo y si se realizó. */
export interface SesionRegistrada {
  readonly sessionId: string;
  readonly date: string;
  readonly occurredAt: string;
  /** Con la condición vigente: realizada o realizada con desvío. */
  readonly realizada: boolean;
}

/** De la lista de «Tu historial» (API-TRN-19-LISTA), solo lo que ordena: la sesión, la fecha y si se realizó. */
export function sesionesRegistradas(ejecuciones: readonly EjecucionDeEntrenamiento[]): SesionRegistrada[] {
  return ejecuciones.map((x) => {
    const condicion = registroVigente(x).sessionCondition;
    return { sessionId: x.plannedSession.sessionId, date: x.date, occurredAt: x.occurredAt, realizada: condicion === 'COMPLETED' || condicion === 'COMPLETED_WITH_DEVIATION' };
  });
}

/** Lo que hace falta del cliente de la API: la lista de «Tu historial». */
interface ConElHistorial {
  misEjecucionesDeEntrenamiento(token: string, periodo: { periodStart: string; periodEnd: string }): Promise<Resultado<HistorialDeEntrenamientoResponse>>;
}

/**
 * La misma lectura de siempre (`leer`, con el mismo cliente y un solo pedido), que además conserva de cada sesión
 * registrada cuál fue, cuándo y si se realizó. Inicio la usa con la actividad de 30 días: no pide nada más ni cambia el
 * resumen, y sigue con la misma clave que «Tu historial».
 */
export async function conLasSesiones<A extends ConElHistorial, R extends object>(api: A, leer: (api: A) => Promise<Resultado<R>>): Promise<Resultado<R & { readonly sesiones: readonly SesionRegistrada[] }>> {
  let sesiones: readonly SesionRegistrada[] = [];
  const espia: A = {
    ...api,
    misEjecucionesDeEntrenamiento: async (token: string, periodo: { periodStart: string; periodEnd: string }) => {
      const r = await api.misEjecucionesDeEntrenamiento(token, periodo);
      if (r.ok) sesiones = sesionesRegistradas(r.datos.data.executions);
      return r;
    },
  };
  const r = await leer(espia);
  return r.ok ? { ok: true, datos: { ...r.datos, sesiones } } : r;
}

export type MotivoDeLaQueSigue = 'sigue' | 'primera' | 'sin-historial';

export interface LaQueSigue {
  /** El lugar en el orden del plan. */
  readonly indice: number;
  /** `sigue`: después de la última realizada; `primera`: no hay ninguna realizada; `sin-historial`: no se pudo leer. */
  readonly motivo: MotivoDeLaQueSigue;
}

/** La más reciente de una lista, por el momento en que ocurrió y, a igual momento, por la fecha. */
function laMasReciente(lista: readonly SesionRegistrada[]): SesionRegistrada | null {
  let r: SesionRegistrada | null = null;
  for (const s of lista) if (!r || s.occurredAt > r.occurredAt || (s.occurredAt === r.occurredAt && s.date > r.date)) r = s;
  return r;
}

/**
 * La sesión que sigue en el orden del plan. `plan` va en el orden del plan; `registradas`, `null` si no se pudo leer.
 * Con un plan vacío, `null`.
 */
export function sesionQueSigue(plan: readonly { readonly sessionId: string }[], registradas: readonly SesionRegistrada[] | null): LaQueSigue | null {
  if (plan.length === 0) return null;
  if (registradas === null) return { indice: 0, motivo: 'sin-historial' };
  const delPlan = new Set(plan.map((s) => s.sessionId));
  const ultima = laMasReciente(registradas.filter((s) => s.realizada && delPlan.has(s.sessionId)));
  if (!ultima) return { indice: 0, motivo: 'primera' };
  const k = plan.findIndex((s) => s.sessionId === ultima.sessionId);
  return { indice: (k + 1) % plan.length, motivo: 'sigue' };
}

/** El encabezado de la tarjeta: «Sigue en tu plan», salvo que no se sepa qué se registró. */
export const encabezadoDeLaQueSigue = (motivo: MotivoDeLaQueSigue): string => (motivo === 'sin-historial' ? T.primeraDeTuPlan : T.sigueEnTuPlan);

/** El lunes de la semana de una fecha civil: la semana empieza el lunes. */
export function lunesDe(fecha: string): string {
  const [a, m, d] = fecha.slice(0, 10).split('-').map(Number);
  const dia = new Date(Date.UTC(a, m - 1, d));
  dia.setUTCDate(dia.getUTCDate() - ((dia.getUTCDay() + 6) % 7));
  return dia.toISOString().slice(0, 10);
}

/**
 * El estado de una sesión en la semana de `hoy`, para la hoja: la última vez que se registró desde el lunes. `null` si no
 * se pudo leer lo registrado: la hoja no afirma nada.
 */
export function estadoEnLaSemana(sessionId: string, registradas: readonly SesionRegistrada[] | null, hoy: string): string | null {
  if (registradas === null) return null;
  const lunes = lunesDe(hoy);
  const ultima = laMasReciente(registradas.filter((s) => s.sessionId === sessionId && s.date >= lunes && s.date <= hoy));
  if (!ultima) return T.sinRegistrar;
  if (ultima.realizada) return ultima.date === hoy ? T.realizadaHoy : T.realizadaEl(diaDeLaSemana(ultima.date));
  return ultima.date === hoy ? T.registradaHoySinRealizar : T.registradaElSinRealizar(diaDeLaSemana(ultima.date));
}

/**
 * Cuándo Inicio usa la tarjeta de la que sigue: un plan sin días (sin agenda, DL-137) con dos o más sesiones. Con días
 * manda el día, como siempre; con una sola sesión, esa; con una en curso, solo esa (AV2-D4), y eso lo decide antes la
 * tarjeta.
 */
export const usaLaQueSigue = (sesiones: number, conAgenda: boolean): boolean => !conAgenda && sesiones >= 2;
