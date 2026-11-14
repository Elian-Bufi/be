/**
 * Lo que BE sabe de un día de Nutrición (WP-GRAFICOS fase 2, rama C; DL-174), para su marca, su lectura y su celda. Lo
 * comparten GR-12, GR-13 y GR-14, así un día dice lo mismo en los tres:
 * - **lleno**: el día tiene cantidades en todos sus registros y ninguna comida del plan sin registro (`COMPLETE`, con las
 *   comidas del plan conocidas). No quiere decir que el día esté entero: un día con solo el desayuno, bien cargado, es así;
 * - **hueco**: es un subtotal, y dice qué falta (registros sin cantidades, una comida diferente sin cantidades, un
 *   nutriente sin dato o una comida del plan sin registro), o es hoy, que sigue en curso;
 * - **contorno cortado** (GR-T41): tiene cantidades en todos sus registros, pero no se puede saber si faltan comidas,
 *   porque no regía un plan o el plan tiene más de un día tipo y ningún registro dice cuál (DL-153);
 * - **nada**: un día sin registros no es un punto ni un cero.
 *
 * Es puro: lo prueba `apps/web/test/graficos-nutricion-y-cuerpo.test.mjs`.
 */
import { valorDeLaMetrica, type MarcaSemantica, type MetricaNutricional, type PuntoAnalitico } from '@be/domain';
import { COPY_NUTRICION_EN_GRAFICOS as C, enumerar } from './copy';

export type MetricaDelGrafico = Exclude<MetricaNutricional, 'RECORDS'>;

export type SaberDelDia = 'CON_TODO' | 'CON_ALGO_QUE_FALTA' | 'SIN_SABER_SI_FALTAN_COMIDAS';

export const MARCA_DEL_DIA: Readonly<Record<SaberDelDia, MarcaSemantica>> = {
  CON_TODO: 'LLENA',
  CON_ALGO_QUE_FALTA: 'HUECA',
  SIN_SABER_SI_FALTAN_COMIDAS: 'CONTORNO_CORTADO',
};

/** Lo que BE sabe de un día con valor: hoy y un subtotal van huecos; sin las comidas del plan conocidas, cortado. */
export function saberDelDia(p: PuntoAnalitico): SaberDelDia {
  if (p.quality !== 'COMPLETE' || p.partialBucket) return 'CON_ALGO_QUE_FALTA';
  const comidas = p.coverage?.planMeals;
  return comidas && comidas.daysKnown > 0 ? 'CON_TODO' : 'SIN_SABER_SI_FALTAN_COMIDAS';
}

/** Por qué no se conocen las comidas del plan de un día: no regía un plan, o no se sabe qué día tipo era. */
export function motivoSinComidas(p: PuntoAnalitico): string {
  const motivo = p.coverage?.planMeals.daysUndetermined[0]?.reason;
  return motivo === 'DAY_TYPE_NOT_RECORDED' ? C.motivoSinDiaTipo : C.motivoSinPlan;
}

/** Lo que falta en un día, en palabras: «1 registro sin cantidades y 1 comida del plan sin registro». */
export function faltantesEnPalabras(p: Pick<PuntoAnalitico, 'missing'>): string {
  return enumerar(
    p.missing.map((m) => {
      const palabras = C.faltante[m.reason];
      return palabras ? `${m.count.toLocaleString('es-AR')} ${m.count === 1 ? palabras[0] : palabras[1]}` : `${m.count.toLocaleString('es-AR')} con un dato que falta`;
    }),
  );
}

/** Si lo que falta es una cantidad (o un dato del nutriente), y no solo una comida del plan sin registro. */
export function faltanCantidades(p: Pick<PuntoAnalitico, 'missing' | 'value'>): boolean {
  return p.value === null || p.missing.some((m) => m.reason !== 'COMIDA_DEL_PLAN_SIN_REGISTRO');
}

/** El valor de un día como lo escribe la pantalla de registro (kcal enteras, gramos con un decimal). */
export const valorDelDia = (valor: number, metrica: MetricaDelGrafico): string => valorDeLaMetrica(valor, metrica);

/**
 * Lo que dice un día, después de su valor: «con cantidades en todos sus registros…», «subtotal: …» o «…no se puede saber
 * si faltan comidas (…)». Lo cargado después se agrega entre paréntesis.
 */
export function calidadDelDia(p: PuntoAnalitico, tarde: boolean): string {
  const despues = tarde ? ` (${C.cargadoDespues})` : '';
  if (p.value === null) return `${C.sinValor(faltantesEnPalabras(p) || C.algoQueFalta)}${despues}`;
  const saber = saberDelDia(p);
  if (saber === 'CON_TODO') return `${C.conTodo}${despues}`;
  if (saber === 'SIN_SABER_SI_FALTAN_COMIDAS') return `${C.sinSaber(motivoSinComidas(p))}${despues}`;
  const partes = [...(p.partialBucket ? [C.hoyEnCurso] : []), ...(p.missing.length > 0 ? [faltantesEnPalabras(p)] : [])];
  return `${C.subtotal(partes.join('; ') || C.algoQueFalta)}${despues}`;
}

/** La lectura entera de un día: «2.150 kcal · con cantidades en todos sus registros y…», o «sin valor: …». */
export function lecturaDelDia(p: PuntoAnalitico, metrica: MetricaDelGrafico, tarde: boolean): string {
  return p.value === null ? calidadDelDia(p, tarde) : `${valorDelDia(p.value, metrica)} · ${calidadDelDia(p, tarde)}`;
}

/** La marca de un día con valor; `null` sin valor (no se dibuja). */
export const marcaDelDia = (p: PuntoAnalitico): MarcaSemantica | null => (p.value === null ? null : MARCA_DEL_DIA[saberDelDia(p)]);

/** Los puntos diarios por fecha, dentro de un rango. */
export function puntosPorFecha(puntos: readonly PuntoAnalitico[], desde: string, hasta: string): Map<string, PuntoAnalitico> {
  return new Map(puntos.filter((p) => p.date >= desde && p.date <= hasta && p.dateEnd === null).map((p) => [p.date, p] as const));
}
