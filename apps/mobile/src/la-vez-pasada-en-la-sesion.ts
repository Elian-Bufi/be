/**
 * «La vez pasada» en la sesión en curso de la APK: PG-11 de WP-PULIDO-GRANDES (DL-173), que es la misma pieza que GR-01
 * de WP-GRAFICOS (DL-174) del lado de la persona. Una línea tenue debajo del ejercicio: «La vez pasada, mar 3 nov:
 * 20 kg × 8 · RIR 2, 20 kg × 8 · RIR 2, 22 kg × 6 · RIR 1». El diseño y las reglas son los del dominio
 * (`la-vez-pasada.ts`), los mismos del editor del profesional; acá se elige la vez y se arma la línea.
 *
 * - **La vez** es la última que la persona hizo ese mismo ejercicio, en cualquier sesión, dentro de los 90 días hasta la
 *   fecha de la sesión que registra (PG-D6), con su fecha. Sale de «Tu historial» (API-TRN-19-LISTA), que la APK ya lee:
 *   ninguna operación nueva.
 * - **Si aquella vez la hizo con otro ejercicio,** la línea lo dice («la hiciste con Prensa de piernas»); si la registró
 *   resumida, también. Lo tildado sin escribir dice «como el plan», como en su tabla.
 * - **Si no hay ninguna, la línea no se dibuja:** ni «0», ni «sin datos». Si la lectura falla, tampoco: la sesión sigue
 *   igual.
 * - **Si la persona sustituyó el ejercicio en esta sesión,** la línea no se muestra: sería de otro ejercicio que el que
 *   registra ahora (decisión del continuador, a ratificar).
 * - **Es de solo lectura** (fase 1 de WP-GRAFICOS): tocarla para copiar los números en la fila que sigue, con
 *   «Deshacer», es el resto de PG-11 y queda para la tanda B. `comparable` ya dice cuándo se va a poder copiar.
 */
import { COPY_LA_VEZ_PASADA, fechaEnPocasPalabras, lineaDeLaVezPasada, marcaDelPlan, numero, textoDeLaSerie, vecesPasadas, type EjecucionDeEntrenamiento, type NotacionDelEsfuerzo, type SerieDeLaVezPasada, type VezPasada } from '@be/domain';

/**
 * DL-192 (DL-194): la línea en la notación del plan de la sesión. En RIR, la del dominio tal cual. En RPE, la misma frase
 * con cada serie en RPE («20 kg × 8 · RPE 8»): `lineaDeLaVezPasada` del dominio todavía no recibe la notación, así que acá
 * se arma con sus mismas piezas (`COPY_LA_VEZ_PASADA`, `marcaDelPlan`, `textoDeLaSerie`), con la voz de la persona.
 */
export function lineaEnLaNotacion(v: VezPasada, hoy: string, paraLeer: boolean, notacion: NotacionDelEsfuerzo): string {
  if (notacion === 'RIR') return lineaDeLaVezPasada(v, hoy, 'persona', paraLeer);
  const c = COPY_LA_VEZ_PASADA;
  const encabezado = c.encabezado(fechaEnPocasPalabras(v.fecha, hoy, paraLeer));
  if (v.como.tipo === 'con-otro') return `${encabezado}: ${v.como.identidad === 'otro-ejercicio' ? c.conOtro('persona', v.como.nombre) : c.conOtroSinIdentidad('persona', v.como.nombre)}`;
  if (v.como.tipo === 'resumida') return `${encabezado}: ${c.resumida('persona')}`;
  const conSuMarca = (s: SerieDeLaVezPasada): string => {
    const marca = marcaDelPlan(s, c.comoElPlan);
    return marca ? `${textoDeLaSerie(s, notacion)} (${marca})` : textoDeLaSerie(s, notacion);
  };
  const seguidas = v.como.series.every((s, i) => s.numero === i + 1);
  const series = v.como.series.map((s) => (seguidas ? conSuMarca(s) : `serie ${numero(s.numero)}: ${conSuMarca(s)}`)).join(', ');
  return `${encabezado}: ${v.como.enLugarDe ? `${series} (${c.enLugarDe(v.como.enLugarDe)})` : series}`;
}

/** PG-D6: la vez pasada se busca en los 90 días hasta la fecha de la sesión, los mismos de «Tu historial». */
export const DIAS_DE_LA_VEZ_PASADA = 90;

export interface LineaDeLaVezPasada {
  /** Lo que se ve: «La vez pasada, mar 3 nov: 20 kg × 8 · RIR 2». */
  readonly texto: string;
  /** Lo mismo con la fecha entera, para el lector de pantalla: «La vez pasada, martes 3 de noviembre: …». */
  readonly paraLeer: string;
  /** Lo registrado es de este mismo ejercicio, serie por serie: lo único que se va a poder copiar a una fila. */
  readonly comparable: boolean;
}

/**
 * La línea del ejercicio activo, o `null` si no se dibuja: sin lo leído todavía, sin ejercicio del catálogo, con el
 * ejercicio sustituido en esta sesión o sin ninguna vez en los 90 días.
 */
export function lineaDeLaVezPasadaDelEjercicio(
  ejecuciones: readonly EjecucionDeEntrenamiento[] | null,
  o: { readonly exerciseId: string | null; readonly fechaDeLaSesion: string; readonly hoy: string; readonly sustituido: boolean; readonly notacion?: NotacionDelEsfuerzo },
): LineaDeLaVezPasada | null {
  if (!ejecuciones || !o.exerciseId || o.sustituido) return null;
  const vez = vecesPasadas(ejecuciones, o.exerciseId, { cuantas: 1, hasta: o.fechaDeLaSesion })[0];
  if (!vez) return null;
  const notacion = o.notacion ?? 'RIR';
  return { texto: lineaEnLaNotacion(vez, o.hoy, false, notacion), paraLeer: lineaEnLaNotacion(vez, o.hoy, true, notacion), comparable: vez.comparable };
}
