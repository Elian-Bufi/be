/**
 * «¿Cuándo la revisás?» (WP-TABLERO-ALTA-GAMA TB-15; DL-163 D-6): la fecha de la próxima revisión, con opciones para
 * tocar, en el paso 3 de la revisión («Lo que decidís») y al activar un plan.
 * - **Las opciones salen del calendario:** en 1, 2 o 4 semanas desde hoy, «Elegir una fecha» o «Sin fecha por ahora».
 *   Cada una dice la fecha que resulta, y al elegir se dice qué pasa con ella.
 * - **Nada viene elegido** (TA-40): hay que elegir, también «Sin fecha por ahora», porque un plan sin revisión acordada
 *   sale de las revisiones de «Te toca a vos» (D-6: «es el caso que más se escapa»). Al activar, si la versión ya traía
 *   una fecha (la de la revisión que la preparó), esa es la elegida, y se dice que ya estaba.
 * - **«Sin fecha por ahora» dice su efecto con lo que BE hace hoy** (TA-41): sin fecha nueva, la expectativa que ya
 *   estaba sigue; la primera vez, no hay ninguna. No se ofrece con «Reprogramar revisión», donde la fecha es
 *   obligatoria (REG-06-145).
 * - **Después de aplicar no se pregunta:** aplicar no recibe una fecha (API-NUT-20 y API-TRN-24 llevan solo la versión
 *   esperada); la fecha viaja en la próxima acción que se registró.
 * Lee solo fechas del profesional: hoy y lo que elige. Vive en el website hasta TB-20 (§8.2 del paquete), como `reloj.ts`.
 */
import { diasEntreFechas } from '@be/domain';

/** Las semanas que se ofrecen para tocar, desde hoy. */
export const SEMANAS_DE_LAS_OPCIONES = [1, 2, 4] as const;
export type SemanasDeLaOpcion = (typeof SEMANAS_DE_LAS_OPCIONES)[number];

export type EleccionDeLaProxima =
  | { readonly tipo: 'NADA' }
  | { readonly tipo: 'EN_SEMANAS'; readonly semanas: SemanasDeLaOpcion }
  /** Una fecha escrita a mano (vacía mientras no se escribe). `yaEstaba`: la traía la versión al abrir. */
  | { readonly tipo: 'FECHA'; readonly fecha: string; readonly yaEstaba?: boolean }
  | { readonly tipo: 'SIN_FECHA' };

export const NADA_ELEGIDO: EleccionDeLaProxima = { tipo: 'NADA' };

/** Dónde se pregunta: en la revisión, la fecha queda al aplicarla; al activar, en ese acto. */
export type MomentoDeLaPregunta = 'REVISION' | 'ACTIVAR';

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const esFecha = (f: string): boolean => FECHA.test(f) && new Date(`${f}T00:00:00Z`).toISOString().slice(0, 10) === f;

export function sumarDias(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/**
 * La fecha civil que resulta de la elección: `undefined` si todavía no se eligió (o falta escribir la fecha), `null`
 * con «Sin fecha por ahora».
 */
export function fechaQueResulta(e: EleccionDeLaProxima, hoy: string): string | null | undefined {
  switch (e.tipo) {
    case 'NADA':
      return undefined;
    case 'EN_SEMANAS':
      return sumarDias(hoy, 7 * e.semanas);
    case 'FECHA':
      return esFecha(e.fecha) ? e.fecha : undefined;
    case 'SIN_FECHA':
      return null;
  }
}

/** Con «Reprogramar revisión» la fecha es obligatoria (REG-06-145): «Sin fecha por ahora» no se ofrece. */
export const admiteSinFecha = (resultado: string): boolean => resultado !== 'RESCHEDULE_REVIEW';
/** Con «Finalizar» no hay próxima revisión: no se pregunta. */
export const sePregunta = (resultado: string): boolean => resultado !== 'FINALIZE';

/** Al cambiar el resultado: si «Sin fecha por ahora» deja de ofrecerse, la elección vuelve a nada. */
export function eleccionAlCambiarElResultado(e: EleccionDeLaProxima, resultado: string): EleccionDeLaProxima {
  return e.tipo === 'SIN_FECHA' && !admiteSinFecha(resultado) ? NADA_ELEGIDO : e;
}

/** Al abrir la activación: la fecha que ya tenía la versión, elegida y dicha; sin fecha, nada elegido. */
export function eleccionAlActivar(fechaDeLaVersion: string | null | undefined): EleccionDeLaProxima {
  return fechaDeLaVersion && esFecha(fechaDeLaVersion.slice(0, 10)) ? { tipo: 'FECHA', fecha: fechaDeLaVersion.slice(0, 10), yaEstaba: true } : NADA_ELEGIDO;
}

/**
 * Lo que falta para seguir, o `null`: nada elegido, o «Elegir una fecha» sin la fecha. Con «Reprogramar revisión», la
 * frase de siempre.
 */
export function loQueFalta(e: EleccionDeLaProxima, hoy: string, resultado: string | null = null): string | null {
  if (fechaQueResulta(e, hoy) !== undefined) return null;
  if (e.tipo === 'FECHA') return COPY_CUANDO.faltaLaFecha;
  return resultado === 'RESCHEDULE_REVIEW' ? COPY_CUANDO.faltaParaReprogramar : COPY_CUANDO.falta;
}

/**
 * El ciclo que acordaste la última vez, como dato y no como opción elegida: de la última revisión registrada con una
 * fecha a esa fecha («a las 4 semanas», «a los 10 días»). En semanas si son semanas justas. `null` si no hay con qué
 * contarlo. Son fechas del profesional: lo que registró la persona no entra.
 */
export function cicloAcordadoAntes(revisiones: readonly { readonly dia: string; readonly acordada: string | null }[]): string | null {
  const ultima = [...revisiones].filter((r) => r.acordada && esFecha(r.acordada.slice(0, 10))).sort((a, b) => b.dia.localeCompare(a.dia))[0];
  if (!ultima?.acordada) return null;
  const dias = diasEntreFechas(ultima.dia, ultima.acordada.slice(0, 10));
  if (dias <= 0) return null;
  if (dias % 7 === 0) return dias === 7 ? 'a la semana' : `a las ${dias / 7} semanas`;
  return dias === 1 ? 'al día siguiente' : `a los ${dias} días`;
}

/** Cómo se escribe una fecha civil en la pantalla («miércoles 11 nov»): lo decide quien muestra. */
export type FechaEnPalabras = (fechaCivil: string) => string;

export const COPY_CUANDO = {
  pregunta: '¿Cuándo la revisás?',
  enSemanas: (semanas: SemanasDeLaOpcion, fecha: string): string => `En ${semanas === 1 ? '1 semana' : `${semanas} semanas`} · ${fecha}`,
  elegirUnaFecha: 'Elegir una fecha',
  laFecha: 'Fecha de la próxima revisión',
  sinFecha: 'Sin fecha por ahora',
  yaEstaba: 'Es la fecha que ya tenía esta versión.',
  cicloAntes: (ciclo: string): string => `La última vez acordaste revisar ${ciclo}.`,
  /** Al elegir una fecha: qué pasa con ella, en el acto que la fija. */
  efecto: (momento: MomentoDeLaPregunta, fecha: string): string =>
    momento === 'REVISION' ? `Al aplicar esta revisión, la próxima queda para el ${fecha}.` : `Al activar, la próxima revisión queda para el ${fecha}.`,
  /**
   * «Sin fecha por ahora», con lo que BE hace hoy (TA-41): sin una fecha nueva, la revisión que ya estaba acordada no
   * cambia; con el primer plan no hay ninguna, y el área no aparece en las revisiones de «Te toca a vos».
   */
  efectoSinFecha: (momento: MomentoDeLaPregunta, primerPlan: boolean): string =>
    momento === 'ACTIVAR' && primerPlan
      ? 'Sin fecha acordada, esta área no aparece en las revisiones de «Te toca a vos».'
      : `${momento === 'REVISION' ? 'Al aplicar esta revisión' : 'Al activar'} no se acuerda una fecha nueva: la revisión que ya estaba acordada no cambia.`,
  falta: 'Elegí cuándo la revisás, o «Sin fecha por ahora».',
  faltaParaReprogramar: 'Para reprogramar, elegí cuándo la revisás.',
  faltaLaFecha: 'Escribí la fecha de la próxima revisión.',
} as const;

/** Las opciones para tocar, en orden, con la fecha que resulta de cada una. */
export function opcionesDeLaPregunta(hoy: string, conSinFecha: boolean, enPalabras: FechaEnPalabras): readonly { readonly clave: string; readonly texto: string; readonly eleccion: EleccionDeLaProxima }[] {
  return [
    ...SEMANAS_DE_LAS_OPCIONES.map((semanas) => ({ clave: `en-${semanas}`, texto: COPY_CUANDO.enSemanas(semanas, enPalabras(sumarDias(hoy, 7 * semanas))), eleccion: { tipo: 'EN_SEMANAS', semanas } as const })),
    { clave: 'fecha', texto: COPY_CUANDO.elegirUnaFecha, eleccion: { tipo: 'FECHA', fecha: '' } as const },
    ...(conSinFecha ? [{ clave: 'sin-fecha', texto: COPY_CUANDO.sinFecha, eleccion: { tipo: 'SIN_FECHA' } as const }] : []),
  ];
}

/** La clave de la opción elegida, para el botón de radio. */
export function claveDeLaEleccion(e: EleccionDeLaProxima): string | null {
  switch (e.tipo) {
    case 'NADA':
      return null;
    case 'EN_SEMANAS':
      return `en-${e.semanas}`;
    case 'FECHA':
      return 'fecha';
    case 'SIN_FECHA':
      return 'sin-fecha';
  }
}
