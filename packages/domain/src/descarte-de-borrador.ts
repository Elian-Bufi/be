/**
 * TB-47 · Descartar un borrador que la persona nunca vio (DEUDA_LEGAJO DL-163 D-21; WP-TABLERO-ALTA-GAMA §4.4, §4.5 y §5).
 *
 * El 05 define el borrador como una versión que «no se presenta al asesorado como plan vigente» (glosario, «Borrador de
 * plan»): descartarlo no borra nada que la persona haya visto. Solo un borrador: una versión activada no se descarta nunca.
 *
 * - La máquina del 06 §10.7 (`TRANSICIONES_DE_VERSION_DE_PLAN` y su par de Entrenamiento) queda literal, con sus dos
 *   estados: sus pruebas son oráculos del 06. El descarte es una extensión declarada aparte, acá, y en la base (la guarda
 *   de la versión de plan suma BORRADOR → DESCARTADA, y DESCARTADA no tiene salida) (TA-64).
 * - La fila se guarda: la historia es por adición (06 §4.4). Quién y cuándo quedan en el evento y en la auditoría (TA-63).
 * - Lo descartado no se muestra ni cuenta en la cadena: para todos es lo mismo que una versión que no existe (TA-65, TA-67).
 *
 * Las mismas reglas valen para Nutrición y Entrenamiento: las dos versiones de plan comparten el enum de estado de la base.
 */

/** Los estados que guarda la base para una versión de plan: los dos del 06 y el terminal de DL-163 D-21. */
export const ESTADOS_DE_VERSION_CON_DESCARTE = ['BORRADOR', 'ACTIVADA', 'DESCARTADA'] as const;
export type EstadoDeVersionConDescarte = (typeof ESTADOS_DE_VERSION_CON_DESCARTE)[number];

/**
 * - `NO_VISIBLE`: no hay versión, o ya se descartó. Es el mismo 404 que lo inexistente: descartar dos veces no revela nada.
 * - `YA_ACTIVADA`: la persona la recibió como su plan. Nunca se descarta; corregirla es emitir una sucesora.
 */
export type EvaluacionDeDescarte = { readonly permitido: true } | { readonly permitido: false; readonly motivo: 'NO_VISIBLE' | 'YA_ACTIVADA' };

export function evaluarDescarteDeBorrador(estado: EstadoDeVersionConDescarte | null): EvaluacionDeDescarte {
  if (estado === null || estado === 'DESCARTADA') return { permitido: false, motivo: 'NO_VISIBLE' };
  if (estado === 'ACTIVADA') return { permitido: false, motivo: 'YA_ACTIVADA' };
  return { permitido: true };
}

/** Una versión descartada no se lista, no se lee y no se escribe: no existe para nadie. */
export function esVersionVisible(estado: EstadoDeVersionConDescarte): estado is 'BORRADOR' | 'ACTIVADA' {
  return estado !== 'DESCARTADA';
}

/**
 * La cadena de un plan, sin lo descartado (REG-06-12). Un borrador descartado no ocupa el lugar de raíz ni el de sucesora:
 * después de descartarlo, el borrador nuevo vuelve a ser la raíz del plan (si nunca se activó) o la sucesora de la
 * vigente. Es la misma regla que los índices parciales de la base (`…_una_raiz` y `…_una_sucesora`).
 */
export function cadenaSinDescartadas<T extends { readonly estado: EstadoDeVersionConDescarte }>(versiones: readonly T[]): T[] {
  return versiones.filter((v) => esVersionVisible(v.estado));
}

/**
 * El estado de la versión en la API (`DRAFT` o `ACTIVATED`, la forma que leen las APK instaladas; DL-152). Falla cerrado:
 * si alguna lectura dejara pasar una versión descartada, es un error del servidor, nunca un borrador a la vista.
 */
export function estadoDeVersionDePlanApi(estado: EstadoDeVersionConDescarte): 'DRAFT' | 'ACTIVATED' {
  if (estado === 'DESCARTADA') throw new Error('BE: una versión de plan descartada no se lee (DL-163 D-21)');
  return estado === 'ACTIVADA' ? 'ACTIVATED' : 'DRAFT';
}
