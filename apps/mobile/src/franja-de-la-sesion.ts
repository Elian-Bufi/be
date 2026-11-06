/**
 * La franja de arriba de la sesión guiada (PA-02, decisión de Dirección del 2026-11-02): el ejercicio, «Ejercicio 2 de 5 ·
 * Serie 3 de 4», una línea de progreso en tramos (uno por ejercicio) y dos tiempos, el de la sesión y el del ejercicio
 * actual.
 *
 * - **Los tramos** dicen cuántas series planificadas de cada ejercicio tienen registro, sin porcentajes ni juicios: es
 *   la misma cuenta de «N de M series registradas». El tramo del ejercicio actual se marca aparte, aunque todavía no
 *   tenga ninguna serie registrada.
 * - **El tiempo del ejercicio** sale de los instantes de la corrida, como el de la sesión (`enVivo` del dominio): la suma
 *   de los tramos en que ese ejercicio estuvo activo, sin las pausas. No se cuenta sumando ticks.
 *
 * Es lógica pura, sin React.
 */
import { calcularTiempos, COPY_ENTRENAMIENTO_POR_SERIE, type DuracionApi, type EventoDeTiempo, type InstanteDeEventoApi } from '@be/domain';
import { estadoLocal, eventosDeLaCorrida, type Corrida } from './corrida-de-entrenamiento';
import type { ResumenDelEjercicio } from './series-de-la-sesion';
import { TEXTOS_DE_LA_SESION } from './textos-de-la-sesion';

export interface TramoDelRecorrido {
  readonly prescriptionId: string;
  /** De 0 a 1: las series planificadas con registro sobre las planificadas. */
  readonly fraccion: number;
  readonly actual: boolean;
}

/** Un tramo por ejercicio, en el orden de la rutina. */
export function tramosDelRecorrido(resumen: readonly ResumenDelEjercicio[], activo: string | null): TramoDelRecorrido[] {
  return resumen.map((r) => {
    const registradasDelPlan = r.planificadas - r.sinRegistrar.length;
    const fraccion = r.planificadas === 0 ? (r.registradas > 0 ? 1 : 0) : Math.min(1, Math.max(0, registradasDelPlan / r.planificadas));
    return { prescriptionId: r.prescriptionId, fraccion, actual: r.prescriptionId === activo };
  });
}

/** Las series planificadas de toda la sesión y cuántas tienen registro: lo que dice el lector de pantalla de los tramos. */
export function cuentaDelRecorrido(resumen: readonly ResumenDelEjercicio[]): { readonly registradas: number; readonly planificadas: number } {
  return resumen.reduce((c, r) => ({ registradas: c.registradas + (r.planificadas - r.sinRegistrar.length), planificadas: c.planificadas + r.planificadas }), { registradas: 0, planificadas: 0 });
}

/** «Ejercicio 2 de 5 · Serie 3 de 4», o «… · Serie 4 · sin planificar» en una serie de más. */
export function posicionEnLaSesion(ejercicio: number, total: number, serie: { readonly setIndex: number; readonly planificada: boolean } | null, planificadas: number): string {
  const t = TEXTOS_DE_LA_SESION;
  if (!serie) return COPY_ENTRENAMIENTO_POR_SERIE.ejercicioDe(ejercicio, total);
  return t.ejercicioYSerie(ejercicio, total, serie.planificada ? t.serieDe(serie.setIndex, planificadas) : t.serieDeMas(serie.setIndex));
}

/**
 * El tiempo en un ejercicio mientras la corrida sigue abierta: la suma de sus tramos activos sin pausas, con `ahora` como
 * fin provisorio. `null` si la corrida no empezó o ya se cerró. No es un dato registrado: se recalcula cada vez.
 */
export function tiempoDelEjercicioEnVivo(corrida: Corrida, ahora: InstanteDeEventoApi, prescriptionId: string): DuracionApi | null {
  const eventos = eventosDeLaCorrida(corrida);
  const estado = estadoLocal(corrida);
  const inicio = eventos.find((e) => e.type === 'SESSION_STARTED');
  if (!inicio || estado.cierre !== null) return null;
  const provisorio: EventoDeTiempo = { eventId: 'provisorio', runId: inicio.runId, sequence: estado.lastSequence + 1, at: ahora, compoundActionId: null, type: 'SESSION_FINISHED', resolution: 'FINISHED' };
  return calcularTiempos([...eventos, provisorio], () => null).exercises.find((e) => e.prescriptionId === prescriptionId)?.duration ?? null;
}

/**
 * Los segundos medidos de la última serie cronometrada de una fila que ya terminó, o `null`. Es lo que el reloj de la fila
 * escribe en el tiempo de la serie al pararlo (DL-161: medido, nunca inferido).
 */
export function segundosMedidosDeLaFila(corrida: Corrida, prescriptionId: string, setIndex: number): number | null {
  const calculo = calcularTiempos(eventosDeLaCorrida(corrida), () => null);
  const medida = calculo.timedSets.filter((s) => s.prescriptionId === prescriptionId && s.setIndex === setIndex && s.finishedAt !== null).pop();
  const ms = medida?.duration.ms ?? null;
  return ms === null || !Number.isFinite(ms) ? null : Math.max(0, Math.round(ms / 1000));
}
