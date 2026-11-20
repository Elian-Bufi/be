/**
 * WP-OBJETIVO-Y-CALCULADOR (OBC-07; DL-186) · La propuesta de rangos desde el cálculo del objetivo, sin React: de dónde
 * salen los números, el reparto por comida que elige el profesional, lo que se manda a API-PLN-03 y lo que se reemplaza.
 *
 * - **Dos cosas distintas, separadas:** el cálculo de macros (del objetivo, con la antropometría) y el rango de referencia de
 *   cada comida (del plan), que ubica cada receta u opción. La propuesta solo lleva el primero al segundo, si el
 *   profesional la revisa y la guarda.
 * - **Nunca pisa lo escrito sin confirmar:** por omisión completa solo lo que no tiene rango; reemplazar lo ya escrito es
 *   una casilla aparte, con la lista de lo que se reemplaza.
 * - Los rangos se guardan en gramos (los del día y los de cada comida), como cualquier rango escrito a mano.
 */
import {
  MACROS_DE_LA_PROPUESTA,
  numero,
  problemasDelReparto,
  propuestaDeRangos,
  repartoParejo,
  repartoSugerido,
  type EscribirRangosRequest,
  type GramosDelDia,
  type MacroDeLaPropuesta,
  type PesoDeReferencia,
  type RangoEntrada,
  type RangoPropuesto,
  type RangosDelPlan,
  type ReferenciaYCalculo,
  type RepartoDeUnaComida,
  type VersionDeObjetivo,
} from '@be/domain';
import { entradaDesde } from './rangos-indicados';

/** De dónde salen los gramos del día: el cálculo del objetivo (con su variante de descanso) o los gramos del objetivo. */
export interface FuenteDeLaPropuesta {
  readonly origen: 'calculo' | 'objetivo';
  readonly texto: string;
  readonly dia: GramosDelDia & { readonly kcal: number };
  readonly descanso: (GramosDelDia & { readonly kcal: number }) | null;
}

/** La fuente, si la hay: primero el cálculo guardado con el objetivo; si no tiene macros, los gramos del objetivo. */
export function fuenteDeLaPropuesta(objetivo: VersionDeObjetivo | null, calculo: ReferenciaYCalculo | null): FuenteDeLaPropuesta | null {
  const m = calculo?.result?.macros;
  if (m) {
    const g = (x: typeof m.day) => ({ protein: x.protein.grams, carbohydrate: x.carbohydrate.grams, fat: x.fat.grams, kcal: x.energyKcal });
    return { origen: 'calculo', texto: 'Desde el cálculo guardado con el objetivo vigente', dia: g(m.day), descanso: m.restDay ? g(m.restDay) : null };
  }
  if (!objetivo) return null;
  const d = objetivo.macronutrientDistribution;
  if (d.protein.unit !== 'g/day' || d.carbohydrate.unit !== 'g/day' || d.fat.unit !== 'g/day') return null;
  return {
    origen: 'objetivo',
    texto: 'Desde los gramos del objetivo vigente (no tiene un cálculo con macros guardado)',
    dia: { protein: d.protein.value, carbohydrate: d.carbohydrate.value, fat: d.fat.value, kcal: objetivo.estimatedEnergyRequirement.value },
    descanso: null,
  };
}

/** Un día tipo del plan, con sus comidas ya guardadas (con identidad). */
export interface DiaDeLaPropuesta {
  readonly dayTypeId: string;
  readonly nombre: string;
  readonly comidas: readonly { readonly mealId: string; readonly nombre: string }[];
}

/** Lo que se escribe para un día tipo: qué variante usa y el reparto de cada comida, en porcentaje del día. */
export interface RepartoEscrito {
  readonly variante: 'dia' | 'descanso';
  readonly comidas: Readonly<Record<string, Readonly<Record<MacroDeLaPropuesta, string>>>>;
}

const enTexto = (r: RepartoDeUnaComida): Readonly<Record<MacroDeLaPropuesta, string>> => ({ protein: String(r.protein), carbohydrate: String(r.carbohydrate), fat: String(r.fat) });

/** El reparto de partida de un día: el sugerido por el nombre de cada comida (o parejo, si no se reconoce ninguna). */
export function repartoInicial(d: DiaDeLaPropuesta, modo: 'sugerido' | 'parejo' = 'sugerido', variante: RepartoEscrito['variante'] = 'dia'): RepartoEscrito {
  const r = modo === 'parejo' ? repartoParejo(d.comidas.length) : repartoSugerido(d.comidas.map((c) => c.nombre));
  return { variante, comidas: Object.fromEntries(d.comidas.map((c, i) => [c.mealId, enTexto(r[i]!)])) };
}

/** Lo escrito, como números; un campo que no se entiende cuenta como `NaN` y no deja proponer. */
function reparto(d: DiaDeLaPropuesta, e: RepartoEscrito): RepartoDeUnaComida[] {
  const n = (s: string | undefined) => {
    const t = (s ?? '').trim().replace(',', '.');
    return t === '' ? 0 : /^\d+(\.\d+)?$/.test(t) ? Number(t) : Number.NaN;
  };
  return d.comidas.map((c) => ({ protein: n(e.comidas[c.mealId]?.protein), carbohydrate: n(e.comidas[c.mealId]?.carbohydrate), fat: n(e.comidas[c.mealId]?.fat) }));
}

/** La propuesta de un día tipo, o por qué todavía no: qué macro no suma 100 y cuánto suma. */
export function propuestaDelDia(
  d: DiaDeLaPropuesta,
  e: RepartoEscrito,
  fuente: FuenteDeLaPropuesta,
  tolerancia: number,
): { readonly ok: true; readonly gramos: GramosDelDia & { readonly kcal: number }; readonly dia: RangoPropuesto; readonly comidas: readonly RangoPropuesto[] } | { readonly ok: false; readonly sumas: readonly { macro: MacroDeLaPropuesta; suma: number }[] } {
  const gramos = e.variante === 'descanso' && fuente.descanso ? fuente.descanso : fuente.dia;
  const r = reparto(d, e);
  const problemas = d.comidas.length > 0 ? problemasDelReparto(r) : [];
  if (problemas.length > 0) return { ok: false, sumas: problemas };
  const p = propuestaDeRangos(gramos, tolerancia, d.comidas.length > 0 ? r : []);
  if (!p) return { ok: false, sumas: [] };
  return { ok: true, gramos, dia: p.dia, comidas: p.comidas };
}

const enGramos = (r: RangoPropuesto): RangoEntrada => ({
  protein: { unit: 'g', min: r.protein.min, max: r.protein.max },
  carbohydrate: { unit: 'g', min: r.carbohydrate.min, max: r.carbohydrate.max },
  fat: { unit: 'g', min: r.fat.min, max: r.fat.max },
});

/** Un día tipo listo para guardar: el rango del día y el de cada comida. */
export interface DiaPropuesto {
  readonly dayTypeId: string;
  readonly dia: RangoPropuesto;
  readonly comidas: readonly { readonly mealId: string; readonly rango: RangoPropuesto }[];
}

/**
 * El cuerpo de API-PLN-03 con la propuesta: todo lo guardado, tal cual, más lo propuesto. Sin `reemplazar`, lo que ya
 * tiene un rango escrito queda como está; con `reemplazar`, se cambia por lo propuesto. Devuelve también qué se reemplaza
 * y qué se conserva, para decirlo antes de guardar.
 */
export function cuerpoConLaPropuesta(
  datos: Pick<RangosDelPlan, 'revision' | 'dayTypes' | 'bodyWeight'>,
  propuestos: readonly DiaPropuesto[],
  nombres: (dayTypeId: string, mealId: string | null) => string,
  reemplazar: boolean,
): { readonly cuerpo: EscribirRangosRequest; readonly reemplazados: readonly string[]; readonly conservados: readonly string[]; readonly nuevos: number } {
  const dias = datos.dayTypes.map((d) => ({ dayTypeId: d.dayTypeId, day: d.day ? entradaDesde(d.day) : null, meals: d.meals.map((m) => ({ mealId: m.mealId, range: entradaDesde(m.range) })) }));
  const reemplazados: string[] = [];
  const conservados: string[] = [];
  let nuevos = 0;
  for (const p of propuestos) {
    let dia = dias.find((d) => d.dayTypeId === p.dayTypeId);
    if (!dia) {
      dia = { dayTypeId: p.dayTypeId, day: null, meals: [] };
      dias.push(dia);
    }
    const poner = (mealId: string | null, rango: RangoPropuesto) => {
      const nombre = nombres(p.dayTypeId, mealId);
      const yaEsta = mealId === null ? dia!.day !== null : dia!.meals.some((m) => m.mealId === mealId);
      if (yaEsta && !reemplazar) return conservados.push(nombre);
      if (yaEsta) reemplazados.push(nombre);
      else nuevos += 1;
      if (mealId === null) dia!.day = enGramos(rango);
      else dia!.meals = [...dia!.meals.filter((m) => m.mealId !== mealId), { mealId, range: enGramos(rango) }];
    };
    poner(null, p.dia);
    for (const c of p.comidas) poner(c.mealId, c.rango);
  }
  const conAlgo = dias.filter((d) => d.day || d.meals.length > 0);
  const enGramosPorKilo = conAlgo.some((d) => [d.day, ...d.meals.map((m) => m.range)].some((r) => r && MACROS_DE_LA_PROPUESTA.some((m) => r[m]?.unit === 'g_per_kg')));
  return { cuerpo: { expectedRevision: datos.revision, bodyWeight: enGramosPorKilo ? pesoGuardado(datos.bodyWeight) : null, dayTypes: conAlgo }, reemplazados, conservados, nuevos };
}

/** El peso que ya usa el plan, para los rangos en g/kg que vuelven tal cual. */
function pesoGuardado(p: PesoDeReferencia | null): EscribirRangosRequest['bodyWeight'] {
  if (!p) return null;
  return p.source === 'RECORDED' && p.measurementId ? { source: 'RECORDED', measurementId: p.measurementId } : { source: 'MANUAL', valueKg: p.valueKg, measuredOn: p.measuredOn };
}

/** «110 a 134 g», en una celda. */
export const limitesEnPalabras = (x: { readonly min: number; readonly max: number }): string => (x.min === x.max ? `${numero(x.min, 0)} g` : `${numero(x.min, 0)} a ${numero(x.max, 0)} g`);

export const NOMBRE_DEL_MACRO_DE_LA_PROPUESTA: Readonly<Record<MacroDeLaPropuesta, string>> = { protein: 'Proteínas', carbohydrate: 'Carbohidratos', fat: 'Grasas' };

export const COPY_PROPUESTA = {
  abrir: 'Proponer rangos desde el cálculo del objetivo',
  titulo: 'Proponer rangos desde el cálculo del objetivo',
  queEs: 'Una propuesta para los rangos de referencia del día y de cada comida, a partir del cálculo de macros del objetivo. Es una estimación: revisala y guardala. Después, cada receta u opción se ubica frente al rango de su comida.',
  sinFuente: 'El objetivo vigente no tiene un cálculo con macros ni gramos por día para proponer. Escribí una versión nueva del objetivo con el calculador.',
  tolerancia: 'Margen alrededor de cada número (± puntos)',
  toleranciaAyuda: 'Con 10, 122 g de proteínas da un rango de 110 a 134 g.',
  variante: 'Qué día usa',
  parejo: 'Repartir parejo',
  sugerido: 'Sugerido por el nombre de cada comida',
  sugeridoAyuda: 'Un punto de partida, como el que pediste: más carbohidratos en el desayuno y el almuerzo; la merienda, con más proteína y grasa. Cambialo a tu criterio.',
  noSuma: (macro: string, suma: number) => `${macro}: las partes suman ${numero(suma, 1)} de 100. Ajustalas para proponer.`,
  reemplazar: (n: number) => `Reemplazar también los ${n} rangos que ya escribiste`,
  reemplazarUno: 'Reemplazar también el rango que ya escribiste',
  seConservan: (lista: string) => `Se conservan como están: ${lista}.`,
  seReemplazan: (lista: string) => `Se reemplazan: ${lista}.`,
  guardar: 'Guardar la propuesta como rangos',
  guardando: 'Guardando…',
  nadaQueGuardar: 'No hay nada nuevo para guardar: todo ya tiene un rango escrito.',
  guardado: (n: number) => (n === 1 ? 'Se guardó 1 rango de la propuesta.' : `Se guardaron ${n} rangos de la propuesta.`),
  sinComidasGuardadas: 'Este día tipo todavía no tiene comidas guardadas: se propone solo el rango del día.',
  activada: 'La versión está activada: sus rangos quedan como se activaron.',
} as const;
