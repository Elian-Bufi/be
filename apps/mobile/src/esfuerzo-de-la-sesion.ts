/**
 * DL-198 (WP-EDITOR-ENTRENAMIENTO-TANDA-2) en la APK: el rótulo de la semana de la fase y el esfuerzo de la sesión al
 * terminar. Es lógica pura: la usan la pantalla de la sesión (`pantallas/entrenamiento.tsx`), la del plan por serie
 * (`pantallas/plan-por-serie.tsx`) y la pregunta (`pantallas/esfuerzo-de-la-sesion.tsx`). La prueba es
 * `esfuerzo-de-la-sesion.test.ts`.
 *
 * - **La semana** (ET2-05 y ET2-06): la API ya manda las cargas y las repeticiones de **esa** semana en los mismos campos
 *   de siempre; la app no calcula nada. Con `week` (solo porque esta APK declara `training-week-load-1`), un rótulo discreto
 *   junto al nombre de la sesión: «Semana 3 de 6» o «Semana 4 de 6 · descarga». Sin `week`, nada cambia.
 * - **El esfuerzo de la sesión** (ET2-07 a ET2-09): se pregunta solo si API-SER-02 trae `askSessionEffort: true` (el plan
 *   lo pide y esta APK declara `training-session-effort-1`). Va **después** de confirmar, en la pantalla de la sesión ya
 *   registrada, como la nota para tu profe: nunca está en el camino de finalizar. Si falla, la sesión sigue registrada.
 * - **Los minutos van con su origen:** los del cronómetro de la sesión (sin pausas) vienen escritos y valen `TIMER`; si la
 *   persona los cambia, `DECLARED`; vacíos, sin minutos (`null` y `null`). La API calcula la carga, no la app.
 * - **Un 409** (ya estaba respondido, por ejemplo desde otro intento que sí llegó) es «guardado»: no se pregunta de nuevo.
 *   Lo que se muestra entonces es solo «quedó guardado», sin repetir el número: el guardado puede ser el de otro intento.
 */
import { COPY_ESFUERZO_DE_LA_SESION, ESCALA_DEL_ESFUERZO_DE_LA_SESION, semanaEnPalabras, textoDelEsfuerzoDeLaSesion, type DuracionApi, type RegistrarEsfuerzoDeLaSesionRequest, type Resultado } from '@be/domain';

// ─── La semana de la fase ───────────────────────────────────────────────────────────────────────

/** Lo que importa de API-SER-02 para esto. */
export interface LecturaDeLaSemana {
  readonly week?: { readonly phaseWeek: number; readonly phaseWeeks: number; readonly deload: boolean } | null;
  readonly askSessionEffort?: boolean | null;
}

/** «Semana 3 de 6», «Semana 4 de 6 · descarga», o `null` sin `week` (la fase no tiene progresión o no llegó la lectura). */
export function rotuloDeLaSemana(lectura: LecturaDeLaSemana | null | undefined): string | null {
  const w = lectura?.week;
  if (!w) return null;
  return semanaEnPalabras({ semana: w.phaseWeek, semanas: w.phaseWeeks, descarga: w.deload });
}

// ─── El esfuerzo de la sesión: cuándo se pregunta ──────────────────────────────────────────────

/** Se pregunta solo con `askSessionEffort: true`. Cualquier otra cosa (ausente, `false`, sin lectura): no. */
export const sePreguntaElEsfuerzo = (lectura: LecturaDeLaSemana | null | undefined): boolean => lectura?.askSessionEffort === true;

/** El tope de la API para los minutos (API-ESF-01). */
export const MAXIMO_DE_MINUTOS = 600;

/**
 * Los minutos del cronómetro de la sesión, sin pausas, redondeados al minuto. Sin medida (`ms` nulo o cero), o fuera de
 * lo que la API acepta (una sesión que quedó abierta horas), `null`: el campo queda vacío y la persona puede escribirlos.
 * Menos de un minuto cuenta como 1: la sesión duró algo.
 */
export function minutosDelCronometro(d: DuracionApi | null | undefined): number | null {
  if (!d || d.ms === null || d.ms <= 0) return null;
  const minutos = Math.max(1, Math.round(d.ms / 60000));
  return minutos > MAXIMO_DE_MINUTOS ? null : minutos;
}

// ─── El esfuerzo de la sesión: lo que se manda ─────────────────────────────────────────────────

export const TEXTOS_DEL_ESFUERZO = {
  ...COPY_ESFUERZO_DE_LA_SESION,
  escala: 'Esfuerzo de la sesión, de 0 a 10',
  guardando: 'Guardando…',
  reintentar: 'Reintentar',
  noSeGuardo: 'No se guardó',
  noSeGuardoReintentar: 'La sesión ya quedó registrada. Revisá la conexión y probá de nuevo.',
  sinAcceso: 'Esta sesión ya no se puede responder. La sesión sigue registrada.',
  noSeEntendio: 'El esfuerzo no se pudo guardar así. Revisá los minutos.',
  minutosAyuda: 'Opcional. Si no sabés cuánto duró, dejalo vacío.',
  minutosInvalidos: `Escribí los minutos con un número entero, de 1 a ${MAXIMO_DE_MINUTOS}.`,
  elegido: (valor: number) => `Respondiste ${valor}: ${textoDelEsfuerzoDeLaSesion(valor)}.`,
} as const;

/** Lo que lee TalkBack en cada opción: «7, Muy duro». */
export const etiquetaDelPunto = (valor: number): string => `${valor}, ${textoDelEsfuerzoDeLaSesion(valor)}`;

/**
 * La palabra que se escribe debajo de cada número: la de la escala, solo donde cambia (en la CR-10 de Foster, el 6 y el 8
 * no llevan palabra: repetirían la del 5 y la del 7). El lector de pantalla la dice en todas (`etiquetaDelPunto`).
 */
export function palabraDebajo(valor: number): string | null {
  const texto = textoDelEsfuerzoDeLaSesion(valor);
  const anterior = valor > 0 ? textoDelEsfuerzoDeLaSesion(valor - 1) : null;
  return texto && texto !== anterior ? texto : null;
}

/** Los once puntos, del 0 al 10, en el orden de la escala. */
export const PUNTOS_DE_LA_ESCALA: readonly number[] = ESCALA_DEL_ESFUERZO_DE_LA_SESION.map((e) => e.valor);

/** Cuántas opciones van por fila en la grilla: cuatro de 64 dp o más entran en el teléfono más angosto, con letra grande. */
export const POR_FILA = 4;

/** Las filas de la grilla, en el orden de la escala: 0-3, 4-7 y 8-10. */
export function filasDeLaEscala(porFila: number = POR_FILA): number[][] {
  const filas: number[][] = [];
  for (let i = 0; i < PUNTOS_DE_LA_ESCALA.length; i += porFila) filas.push(PUNTOS_DE_LA_ESCALA.slice(i, i + porFila));
  return filas;
}

/** El texto inicial del campo de minutos: los del cronómetro, o vacío. */
export const minutosIniciales = (delCronometro: number | null): string => (delCronometro === null ? '' : String(delCronometro));

/**
 * El cuerpo de API-ESF-01, o por qué no se puede mandar. Los minutos escritos se comparan con los del cronómetro: iguales,
 * `TIMER`; distintos, `DECLARED`; vacíos, sin minutos. Un texto que no es un entero de 1 a 600 no se manda.
 */
export function cuerpoDelEsfuerzo(d: { readonly valor: number | null; readonly minutosEscritos: string; readonly delCronometro: number | null }):
  | { readonly ok: true; readonly cuerpo: RegistrarEsfuerzoDeLaSesionRequest }
  | { readonly ok: false; readonly motivo: 'sin-valor' | 'minutos' } {
  if (d.valor === null || !Number.isInteger(d.valor) || d.valor < 0 || d.valor > 10) return { ok: false, motivo: 'sin-valor' };
  const escrito = d.minutosEscritos.trim();
  if (escrito === '') return { ok: true, cuerpo: { rating: d.valor, durationMinutes: null, durationSource: null } };
  if (!/^\d+$/.test(escrito)) return { ok: false, motivo: 'minutos' };
  const minutos = Number(escrito);
  if (minutos < 1 || minutos > MAXIMO_DE_MINUTOS) return { ok: false, motivo: 'minutos' };
  return { ok: true, cuerpo: { rating: d.valor, durationMinutes: minutos, durationSource: d.delCronometro !== null && minutos === d.delCronometro ? 'TIMER' : 'DECLARED' } };
}

/** Por qué el esfuerzo no se guardó, y si sirve reintentar con la misma clave. */
export type MotivoDelEsfuerzo = 'conexion' | 'sin-acceso' | 'no-se-entendio';

/**
 * Qué pasó con API-ESF-01. Guardado solo con la respuesta del servidor, o con el 409 de una sesión que ya tenía su
 * respuesta (no se pregunta dos veces). Sin respuesta, con un 5xx o con demasiados pedidos, se reintenta con la misma
 * clave. Con el 404 (la sesión ya no es de la persona) o con un cuerpo que la API no acepta, reintentar no cambia nada.
 */
export function trasGuardarElEsfuerzo(r: Resultado<unknown>): { readonly tipo: 'guardado' } | { readonly tipo: 'no-se-guardo'; readonly motivo: MotivoDelEsfuerzo; readonly reintentable: boolean } {
  if (r.ok) return { tipo: 'guardado' };
  // El 409 de una sesión con su respuesta, o el de una clave ya usada con otro cuerpo (el primer envío llegó).
  if (r.tipo === 'API' && (r.codigo === 'RESOURCE_CONFLICT' || r.codigo === 'IDEMPOTENCY_KEY_REUSED')) return { tipo: 'guardado' };
  if (r.tipo !== 'API' || r.codigo === 'RESPUESTA_NO_RECONOCIDA' || r.status >= 500 || r.codigo === 'RATE_LIMITED') return { tipo: 'no-se-guardo', motivo: 'conexion', reintentable: true };
  if (r.codigo === 'RESOURCE_NOT_FOUND') return { tipo: 'no-se-guardo', motivo: 'sin-acceso', reintentable: false };
  return { tipo: 'no-se-guardo', motivo: 'no-se-entendio', reintentable: false };
}

/** Lo que dice la pantalla cuando el esfuerzo no se guardó. */
export const TEXTO_DEL_MOTIVO_DEL_ESFUERZO: Readonly<Record<MotivoDelEsfuerzo, string>> = {
  conexion: TEXTOS_DEL_ESFUERZO.noSeGuardoReintentar,
  'sin-acceso': TEXTOS_DEL_ESFUERZO.sinAcceso,
  'no-se-entendio': TEXTOS_DEL_ESFUERZO.noSeEntendio,
};
