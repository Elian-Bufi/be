/**
 * DL-192 · RPE y máximo estimado (Dirección, 2026-11-22; `docs/paquetes/WP-RPE-Y-MAXIMO-ESTIMADO.md`, RPE-01 a RPE-07).
 *
 * **Una sola medida, dos notaciones.** BE guarda las repeticiones en reserva (RIR) y nada más. El RPE de este módulo es
 * otra forma de escribir ese mismo número: la escala de RPE basada en RIR de Zourdos y colaboradores (2016, *Journal of
 * Strength and Conditioning Research*), la que usan Helms y el powerlifting, con **RPE = 10 − RIR**, de 6 a 10 con
 * medios puntos (RPE 8,5 = RIR 1,5).
 * - **Lo guardado es el RIR** (RPE-D02): la prescripción, la serie registrada, la serie observada y la estimación. El
 *   historial, los gráficos (`entrenamiento.rir` del análisis) y la comparación entre profesionales no cambian: comparan
 *   RIR con RIR, se haya escrito como se haya escrito.
 * - **El criterio de intensidad sigue siendo uno de dos** (REG-06-128): `PERCENT_RM` o `RIR`. Prescribir «RPE 8» es el
 *   criterio RIR con el valor 2, escrito en la notación del plan. No es un tercer criterio ni el esfuerzo percibido de la
 *   ejecución (REG-06-129): `perceivedExertion` (de 0 a 10, del 09) es otro dato y este módulo no lo escribe ni lo lee.
 * - **La notación la elige el profesional en la versión del plan** (RPE-D01), y la persona responde y ve todo en esa
 *   notación. Un plan sin notación es RIR, como todos los de antes.
 * - **«6 o menos»** (RPE-D03). Lejos del fallo la estimación de las repeticiones en reserva pierde precisión (Zourdos y
 *   colaboradores, 2016; Halperin y colaboradores, 2022, *Sports Medicine*): la escala de Zourdos agrupa 5 y 6 como «4 a
 *   6 en reserva». BE no distingue por debajo de RPE 6: la opción más baja es «6 o menos», que se guarda como RIR 4, y
 *   cualquier RIR de 4 o más se muestra «RPE 6 o menos». En RIR, el número se muestra tal cual.
 * - **Ida y vuelta sin perder nada:** de una opción de RPE al RIR y de vuelta, la misma opción; de un RIR de 0 a 4 en
 *   medios puntos al RPE y de vuelta, el mismo RIR. Lo único que se agrupa es lo que ya estaba agrupado: un RIR mayor que
 *   4 se lee «6 o menos», y el número guardado no cambia mientras nadie lo reescriba.
 *
 * **El RPE de la sesión** (Foster, CR-10 × minutos) no está acá: va con «registrar otro deporte» (RPE-D09).
 *
 * Sin React, sin base y sin red.
 */
import { COPY_FUERZA, type MotivoFueraDeLaEstimacion } from './estimacion-de-fuerza';
import { numero } from './formato-numeros';

export type NotacionDelEsfuerzo = 'RIR' | 'RPE';
export const NOTACIONES_DEL_ESFUERZO: readonly NotacionDelEsfuerzo[] = ['RIR', 'RPE'];
/** Un plan sin notación (todos los de antes de DL-192) es RIR. */
export const NOTACION_POR_OMISION: NotacionDelEsfuerzo = 'RIR';

/** RPE 10 es el fallo: RIR 0. */
export const RPE_DEL_FALLO = 10;
/** El piso de la escala: RPE 6, que se elige y se lee «6 o menos». */
export const RPE_DEL_PISO = 6;
/** El RIR que guarda «6 o menos»: 4 en reserva. */
export const RIR_DEL_PISO = RPE_DEL_FALLO - RPE_DEL_PISO;
/** La escala de Zourdos empieza en 1: un RPE menor no es de la escala. */
const RPE_MINIMO_DE_LA_ESCALA = 1;

/** Sin el ruido del binario: 10 − 0,3 es 9,7, no 9,700000000000001. */
const sinRuido = (x: number): number => Math.round(x * 1000) / 1000;

/** Lo que llega guardado (o de un cliente): solo `RPE` es RPE; lo demás, también lo ausente, es RIR. */
export function notacionDe(valor: unknown): NotacionDelEsfuerzo {
  return valor === 'RPE' ? 'RPE' : 'RIR';
}

/** Si un RIR cae en «6 o menos»: 4 o más en reserva. */
export const enElPisoDelRpe = (rir: number): boolean => rir >= RIR_DEL_PISO;

/** El RPE de un RIR: 10 − RIR; con 4 o más en reserva, 6 («6 o menos»). `null` si no es un RIR (negativo o no finito). */
export function rpeDeUnRir(rir: number): number | null {
  if (!Number.isFinite(rir) || rir < 0) return null;
  return enElPisoDelRpe(rir) ? RPE_DEL_PISO : sinRuido(RPE_DEL_FALLO - rir);
}

/**
 * El RIR que se guarda para un RPE: 10 − RPE, de 6 a 10 con medios puntos. De 1 a 6, «6 o menos» (RIR 4). `null` fuera de
 * la escala (más de 10, menos de 1) o un RPE de 6 a 10 que no cae en un medio punto (8,3).
 */
export function rirDeUnRpe(rpe: number): number | null {
  if (!Number.isFinite(rpe) || rpe > RPE_DEL_FALLO || rpe < RPE_MINIMO_DE_LA_ESCALA) return null;
  if (rpe <= RPE_DEL_PISO) return RIR_DEL_PISO;
  if (!Number.isInteger(sinRuido(rpe * 2))) return null;
  return sinRuido(RPE_DEL_FALLO - rpe);
}

export const COPY_NOTACION_DEL_ESFUERZO = {
  /** El rótulo de cada notación, en los campos y en los renglones. */
  etiqueta: { RIR: 'RIR', RPE: 'RPE' } satisfies Record<NotacionDelEsfuerzo, string>,
  /** El nombre largo, para el selector del plan. */
  nombre: { RIR: 'RIR (repeticiones en reserva)', RPE: 'RPE (esfuerzo de 6 a 10)' } satisfies Record<NotacionDelEsfuerzo, string>,
  piso: '6 o menos',
  titulo: 'Cómo se escribe el esfuerzo',
  /** Lo corto, a la vista junto al selector. */
  queEs: 'Es la misma medida escrita de dos formas: RPE = 10 − RIR. La persona responde y ve todo así.',
  /** Lo largo y las fuentes, detrás del «?» (`ExplicacionAPedido`). */
  explicacion: [
    'BE guarda siempre las repeticiones en reserva (RIR). El RPE es la escala basada en RIR: RPE 10 es el fallo, RPE 9 deja una repetición, RPE 8 deja dos, y así de a medio punto (RPE 8,5 = RIR 1,5).',
    'Por debajo de RPE 6 (cuatro o más en reserva) se estima mal cuánto queda: BE lo agrupa en «6 o menos» y lo guarda como RIR 4.',
    'El historial, los gráficos y lo que ven otros profesionales no cambian: todo está guardado en RIR. Cambiar la notación cambia solo cómo se escribe y se lee.',
    'El esfuerzo percibido de la sesión (de 0 a 10 por los minutos) es otra medida y no está acá.',
  ],
  fuentes: 'Zourdos y colaboradores (2016), Journal of Strength and Conditioning Research: la escala de RPE basada en las repeticiones en reserva. Helms y colaboradores (2016), Strength and Conditioning Journal: su uso para indicar la intensidad.',
} as const;

/** El valor como se lee y se escribe en un campo: «2» en RIR; «8», «8,5» o «6 o menos» en RPE. `''` si no es un RIR. */
export function esfuerzoEnCampo(rir: number, notacion: NotacionDelEsfuerzo): string {
  if (notacion === 'RIR') return Number.isFinite(rir) ? numero(rir) : '';
  const rpe = rpeDeUnRir(rir);
  if (rpe === null) return '';
  return enElPisoDelRpe(rir) ? COPY_NOTACION_DEL_ESFUERZO.piso : numero(rpe);
}

/** «RIR 2», «RPE 8», «RPE 6 o menos». `null` si no hay valor: el que llama dice «Sin indicar». */
export function textoDelEsfuerzo(rir: number | null | undefined, notacion: NotacionDelEsfuerzo): string | null {
  if (rir === null || rir === undefined) return null;
  const valor = esfuerzoEnCampo(rir, notacion);
  return valor === '' ? null : `${COPY_NOTACION_DEL_ESFUERZO.etiqueta[notacion]} ${valor}`;
}

/** Un número escrito con coma o punto: «8,5», «8.5», «8». */
const NUMERO_ESCRITO = /^\d+(?:[.,]\d+)?$/;
/** «6 o menos», «6-», «≤6», «<6», «<= 6», también «rpe 6 o menos». */
const PISO_ESCRITO = /^(?:(?:≤|<=?)\s*6|6\s*(?:o\s*menos|-|o\s*-))$/;

/**
 * Lo que escribe el profesional en un campo de RPE, como el RIR que se guarda. Entiende «8», «8,5», «8.5» y el piso
 * («6 o menos», «≤ 6», «6-»); un RPE de 1 a 6 es «6 o menos». `null` si no se entiende o no es de la escala.
 */
export function leerRpeEscrito(texto: string): number | null {
  const t = texto.trim().toLowerCase().replace(/^rpe\s*/, '').replace(/\s+/g, ' ');
  if (t === '') return null;
  if (PISO_ESCRITO.test(t)) return RIR_DEL_PISO;
  if (!NUMERO_ESCRITO.test(t)) return null;
  return rirDeUnRpe(Number(t.replace(',', '.')));
}

/** Una opción para elegir el esfuerzo: lo que se lee y el RIR que se guarda. */
export interface OpcionDeEsfuerzo {
  readonly rir: number;
  readonly texto: string;
}

/** Las opciones del RPE, del fallo al piso: 10, 9,5 … 6,5 y «6 o menos» (RIR 0 a 4, de a medio). */
export const OPCIONES_DE_RPE: readonly OpcionDeEsfuerzo[] = [10, 9.5, 9, 8.5, 8, 7.5, 7, 6.5, 6].map((rpe) => ({
  rir: sinRuido(RPE_DEL_FALLO - rpe),
  texto: rpe === RPE_DEL_PISO ? COPY_NOTACION_DEL_ESFUERZO.piso : numero(rpe),
}));

/**
 * La notación de lo que se lee de una persona (el historial, la fuerza): la de la versión vigente del plan; sin vigente,
 * la de la versión más nueva; sin ninguna, RIR. Una versión que no la dice (de antes de DL-192) es RIR.
 */
export function notacionDeLasVersiones(
  versiones: readonly { readonly isEffective: boolean; readonly createdAt: string; readonly effortNotation?: NotacionDelEsfuerzo | null }[],
): NotacionDelEsfuerzo {
  const vigente = versiones.find((v) => v.isEffective);
  if (vigente) return notacionDe(vigente.effortNotation);
  const masNueva = [...versiones].sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0))[0];
  return notacionDe(masNueva?.effortNotation);
}

/**
 * RPE-D01 · la notación con la que nace un borrador: la pedida; si no, la de la versión de la que parte (una sucesora o
 * la versión que sale de una revisión); si no, la última que usó ese profesional, con cualquier persona; si no, RIR.
 */
export function notacionInicial(p: { readonly pedida?: NotacionDelEsfuerzo | null; readonly deLaBase?: unknown; readonly ultimaDelProfesional?: unknown }): NotacionDelEsfuerzo {
  if (p.pedida) return p.pedida;
  if (p.deLaBase !== undefined && p.deLaBase !== null) return notacionDe(p.deLaBase);
  return notacionDe(p.ultimaDelProfesional);
}

// ─── El máximo estimado en la notación (RPE-04, RPE-05) ─────────────────────────────────────────────────────────────

/**
 * «estimado con 5 reps a RPE 8» o «estimado con 5 reps a RIR 2»: con qué serie salió una estimación de Epley v1, en la
 * notación del plan. Va al lado del valor: el valor no se lee como una repetición máxima probada (RPE-D06).
 */
export function conQueSeEstimo(e: { readonly repeticiones: number; readonly rir: number }, notacion: NotacionDelEsfuerzo): string {
  return `estimado con ${numero(e.repeticiones)} ${e.repeticiones === 1 ? 'rep' : 'reps'} a ${textoDelEsfuerzo(e.rir, notacion) ?? `${COPY_NOTACION_DEL_ESFUERZO.etiqueta[notacion]} ${numero(e.rir)}`}`;
}

/**
 * Los textos de la regla de la estimación (DL-171: RIR de 0 a 2) en la notación del plan. Con RIR, los de siempre
 * (`COPY_FUERZA`); con RPE, los mismos límites escritos al revés: RPE de 8 a 10. El método no cambia (RPE-D05).
 */
export function copyDeLaEstimacion(notacion: NotacionDelEsfuerzo): {
  readonly reglaDelRir: string;
  readonly campoDelRir: string;
  readonly rotuloDelCampo: string;
  readonly sinRir: string;
  readonly rirMayorQue2: string;
  readonly motivoRirMayorQue2: string;
  readonly motivoSinRir: string;
} {
  if (notacion === 'RIR') {
    return {
      reglaDelRir: COPY_FUERZA.reglaDelRir,
      campoDelRir: COPY_FUERZA.campoDelRir,
      rotuloDelCampo: 'RIR',
      sinRir: COPY_FUERZA.sinRir,
      rirMayorQue2: COPY_FUERZA.rirMayorQue2,
      motivoRirMayorQue2: COPY_FUERZA.motivo.RIR_MAYOR_QUE_2,
      motivoSinRir: COPY_FUERZA.motivo.SIN_RIR,
    };
  }
  return {
    reglaDelRir: 'BE estima solo con series de RPE 8 a 10 (RIR 0 a 2): más lejos del fallo, el esfuerzo que se escribe es menos confiable.',
    campoDelRir: 'De 8 a 10',
    rotuloDelCampo: 'RPE',
    sinRir: 'Sin RPE no se puede estimar',
    rirMayorQue2: 'Con un RPE menor que 8 no se estima',
    motivoRirMayorQue2: 'el RPE es menor que 8',
    motivoSinRir: 'no tiene RPE',
  };
}

/** El motivo de una serie que no entra, en la notación: solo cambian los dos del esfuerzo. */
export function motivoEnLaNotacion(motivo: MotivoFueraDeLaEstimacion, enPalabras: string, notacion: NotacionDelEsfuerzo): string {
  if (notacion === 'RIR') return enPalabras;
  const c = copyDeLaEstimacion(notacion);
  if (motivo === 'RIR_MAYOR_QUE_2') return c.motivoRirMayorQue2;
  if (motivo === 'SIN_RIR') return c.motivoSinRir;
  return enPalabras.replace(/\bel RIR\b/g, 'el RPE');
}
