/**
 * Lo que dice la pantalla cuando la API rechaza una escritura de Antropometría por un motivo que se puede explicar
 * (WP-ESCRITORIO-AREAS, parte 9; DEC-A24 del plan de Antropometría). Antes estos rechazos caían en el mensaje general
 * —«El servicio no está disponible en este momento»—, que hace pensar que BE está caído cuando lo que pasa es otra cosa:
 * una fecha futura, una medición anulada, un método al que le falta un dato. Como en «Pedir información», cada código
 * conocido tiene su texto; lo demás sigue diciendo el mensaje general (`mensajeDeFallo`). El código nunca se muestra.
 * Sin interfaz: lo usan la carga de una toma, el panel de una medición y los cálculos; lo prueba
 * `scripts/rechazos-de-antropometria.test.mjs`.
 */

/** Lo que importa de un rechazo de la API (`Resultado` de `@be/domain`, cuando `ok` es `false` y `tipo` es `'API'`). */
interface Rechazo {
  readonly ok: false;
  readonly tipo: 'API';
  readonly codigo: string;
  readonly issues: readonly { readonly code: string; readonly path?: string }[];
}

/** La fecha de una toma no puede ser futura (lo comprueba también la pantalla, antes de guardar). */
export const FECHA_DE_TOMA_FUTURA = 'La fecha de la toma no puede ser futura.';

/** Qué dice cada rechazo conocido, por código de la API. */
export const TEXTO_DEL_RECHAZO: Readonly<Record<string, string>> = {
  ANTHROPOMETRY_EVALUATION_NOT_EDITABLE: 'Esta toma ya se registró: no se edita. Para cambiar una medición, corregila o anulala desde «Tomas».',
  CORRECTION_NOT_ALLOWED: 'Esta medición está anulada: no se corrige. Si hay una observación nueva, cargala en una toma nueva.',
  UNIT_NOT_COMPATIBLE: 'La corrección tiene que estar en la misma unidad que la medición: BE no convierte unidades.',
  ANTHROPOMETRY_ANNULMENT_NOT_ALLOWED: 'Anular una medición pide un motivo.',
  CALCULATION_INPUTS_INSUFFICIENT: 'Las mediciones de esta toma no alcanzan para este método: «Pide» dice qué le falta. No se calculó nada.',
  CALCULATION_NOT_REPRODUCIBLE: 'No se pudo calcular con estas mediciones: cada dato tiene que salir de esta toma. No se calculó nada.',
  METHOD_VERSION_NOT_SELECTABLE: 'Ese método ya no se puede elegir (es una versión anterior, o salió del catálogo). Lo que ya se calculó con él sigue en la historia.',
  CALCULATION_REFERENCE_NOT_COMPATIBLE: 'Ese cálculo no corresponde a esta finalidad: no se dejó como referencia.',
};

const esRechazo = (r: unknown): r is Rechazo =>
  typeof r === 'object' && r !== null && (r as { ok?: unknown }).ok === false && (r as { tipo?: unknown }).tipo === 'API' && typeof (r as { codigo?: unknown }).codigo === 'string';

/**
 * El motivo de un rechazo conocido, y el campo al que corresponde si lo hay (`momento`: «Cuándo se tomó»). `null` si el
 * rechazo no es uno de estos: la pantalla dice entonces el mensaje general.
 */
export function motivoDelRechazo(r: unknown): { readonly texto: string; readonly campo: 'momento' | null } | null {
  if (!esRechazo(r)) return null;
  const issues = Array.isArray(r.issues) ? r.issues : [];
  if (r.codigo === 'ANTHROPOMETRY_EVALUATION_INVALID') {
    if (issues.some((i) => i.code === 'OCCURRED_AT_IN_FUTURE')) return { texto: FECHA_DE_TOMA_FUTURA, campo: 'momento' };
    // El otro motivo de ese código: registrar una toma que quedó sin mediciones.
    return { texto: 'Una toma sin mediciones no se puede registrar.', campo: null };
  }
  const texto = TEXTO_DEL_RECHAZO[r.codigo];
  return texto ? { texto, campo: null } : null;
}

/** ¿La fecha elegida (`YYYY-MM-DDTHH:mm`, en la hora de la pantalla) es posterior a este minuto? */
export function esFechaFutura(momento: string, ahora: Date = new Date()): boolean {
  const elegido = new Date(momento);
  if (Number.isNaN(elegido.getTime())) return false;
  const esteMinuto = new Date(ahora);
  esteMinuto.setSeconds(59, 999);
  return elegido.getTime() > esteMinuto.getTime();
}
