/**
 * DL-192 en la APK (DL-194, APK 0.32; `docs/paquetes/WP-RPE-Y-MAXIMO-ESTIMADO.md` §7): el esfuerzo de cada serie en la
 * notación del plan. Es la lógica pura, sin React: la usan la sesión, el registro rápido, la corrección y el plan, y la
 * prueba `scripts/esfuerzo-en-la-app.test.mjs`.
 *
 * - **La notación es la de la versión del plan** (`effortNotation`), que la API manda en API-TRN-09 y API-SER-02 a esta
 *   APK porque declara `training-effort-notation-1`. Sin el campo (un plan de antes, una API sin DL-192, la sesión
 *   general de «Hoy» cuando API-SER-02 no se pudo leer) es RIR, como siempre (`notacionDe` del dominio).
 * - **Lo que se manda es siempre el RIR** (`rir`, con su `fieldOrigins.rir`): el RPE es otra forma de escribir el mismo
 *   número (RPE = 10 − RIR). En RPE no se escribe: se elige una de las opciones del dominio (`OPCIONES_DE_RPE`: 10, 9,5 …
 *   6,5 y «6 o menos»), y lo elegido se guarda en la fila como su texto, igual que un número escrito.
 * - **Lo guardado no cambia mientras nadie lo reescriba** (RPE-D03): un RIR de 5 se lee «6 o menos»; si la persona no lo
 *   toca, vuelve a viajar como 5, no como el 4 de «6 o menos» (`leerEsfuerzo` con `anterior`).
 * - **Se muestra con los textos del dominio**: el valor de una celda con `esfuerzoEnCampo`, y lo demás con `textoDeRir`,
 *   `textoDelPlanDeLaSerie`, `lineasDePrescripcion` y `serieRegistradaEnPalabras`, que reciben la notación.
 */
import { COPY_ENTRENAMIENTO_POR_SERIE, COPY_NOTACION_DEL_ESFUERZO, esfuerzoEnCampo, leerNumero, leerRpeEscrito, motivoDeNumeroIlegible, notacionDe, OPCIONES_DE_RPE, type NotacionDelEsfuerzo, type OpcionDeEsfuerzo } from '@be/domain';

export type { NotacionDelEsfuerzo };

/** El máximo de RIR que admite el contrato de una serie realizada (`SerieEjecutadaSchema`). */
export const RIR_MAXIMO = 20;

/** La notación de lo que llega de la API (API-TRN-09, API-SER-02) o del teléfono: solo `RPE` es RPE; lo demás, RIR. */
export function notacionDeLaLectura(d: { readonly effortNotation?: unknown } | null | undefined): NotacionDelEsfuerzo {
  return notacionDe(d?.effortNotation);
}

/** El rótulo corto del esfuerzo, para la columna y los nombres: «RIR» o «RPE». */
export const rotuloDelEsfuerzo = (notacion: NotacionDelEsfuerzo): string => COPY_NOTACION_DEL_ESFUERZO.etiqueta[notacion];

/** Los textos de la APK que cambian con la notación: la columna, el título del campo, la ayuda y su ejemplo. */
export function textosDelEsfuerzo(notacion: NotacionDelEsfuerzo): {
  readonly columna: string;
  readonly titulo: string;
  readonly ayuda: string;
  readonly ejemplo: string;
  readonly noInformado: string;
} {
  if (notacion === 'RIR') {
    return {
      columna: COPY_ENTRENAMIENTO_POR_SERIE.columnaRir,
      titulo: COPY_ENTRENAMIENTO_POR_SERIE.rirTitulo,
      ayuda: COPY_ENTRENAMIENTO_POR_SERIE.rirAyuda,
      ejemplo: COPY_ENTRENAMIENTO_POR_SERIE.rirEjemplo,
      noInformado: 'RIR no informado',
    };
  }
  return {
    columna: 'RPE',
    titulo: 'RPE (opcional)',
    ayuda: 'Qué tan cerca del fallo terminaste la serie, de 6 a 10: RPE 10 es que no podías hacer otra repetición manteniendo la técnica',
    ejemplo: 'RPE 8: creés que te quedaban 2 repeticiones',
    noInformado: 'RPE no informado',
  };
}

/** Lo que se ve en una celda: «2» en RIR; «8», «8,5» o «6 o menos» en RPE. `null` si no hay valor. */
export function esfuerzoParaMostrar(rir: number | null | undefined, notacion: NotacionDelEsfuerzo): string | null {
  if (rir === null || rir === undefined) return null;
  const v = esfuerzoEnCampo(rir, notacion);
  return v === '' ? null : v;
}

/** Lo que vuelve a una fila para editarlo: el mismo texto que se ve, o vacío. */
export const esfuerzoParaEditar = (rir: number | null | undefined, notacion: NotacionDelEsfuerzo): string => esfuerzoParaMostrar(rir, notacion) ?? '';

/** Las opciones para elegir el RPE de una serie: las del dominio, del fallo al piso. */
export const OPCIONES_DEL_RPE: readonly OpcionDeEsfuerzo[] = OPCIONES_DE_RPE;

/** El RPE va de 6 a 10, de a medio punto: lo que dice la fila si llega otra cosa (un texto viejo, a mano). */
export const ERROR_DEL_RPE = `El RPE va de 10 a 6, de a medio punto: ${OPCIONES_DE_RPE.map((o) => o.texto).join(', ')}.`;
export const ERROR_DEL_RIR = 'El RIR va de 0 a 20.';

/** La opción de RPE que corresponde a un texto de la fila, o `null`. */
export function opcionDelTexto(texto: string): OpcionDeEsfuerzo | null {
  const rir = leerRpeEscrito(texto);
  if (rir === null) return null;
  return OPCIONES_DE_RPE.find((o) => o.rir === rir) ?? null;
}

/**
 * El esfuerzo escrito (o elegido) en una fila, como el RIR que se manda. Vacío es `null` (no informado); el cero es un
 * valor. En RIR, el número de siempre, de 0 a 20. En RPE, una de las opciones del dominio. Con `anterior` (el RIR que ya
 * estaba registrado), si el texto es exactamente el que ese RIR muestra, vuelve ese RIR: lo guardado no cambia solo por
 * leerse en otra notación.
 */
export function leerEsfuerzo(texto: string, notacion: NotacionDelEsfuerzo, anterior?: number | null): { readonly rir: number | null; readonly error?: string } {
  const t = texto.trim();
  if (t === '') return { rir: null };
  if (anterior !== null && anterior !== undefined && esfuerzoParaEditar(anterior, notacion) === t) return { rir: anterior };
  if (notacion === 'RIR') {
    const n = leerNumero(t);
    if (n === null) return { rir: null, error: motivoDeNumeroIlegible(t) };
    if (n < 0 || n > RIR_MAXIMO) return { rir: n, error: ERROR_DEL_RIR };
    return { rir: n };
  }
  const opcion = opcionDelTexto(t);
  return opcion ? { rir: opcion.rir } : { rir: null, error: ERROR_DEL_RPE };
}

/** «RPE 8», «RIR 2» o «RPE no informado», para la frase de una fila que lee el lector de pantalla. */
export function esfuerzoEnLaFrase(rir: number | null | undefined, notacion: NotacionDelEsfuerzo): string {
  const v = esfuerzoParaMostrar(rir, notacion);
  return v === null ? textosDelEsfuerzo(notacion).noInformado : `${rotuloDelEsfuerzo(notacion)} ${v}`;
}
