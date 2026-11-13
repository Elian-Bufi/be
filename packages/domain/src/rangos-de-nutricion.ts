/**
 * API-PLN-02 y API-PLN-03 (decisión de Dirección del 2026-11-13, «Último peso, guardado en gramos») · La cuenta de los
 * rangos de macronutrientes, sin base ni red: la usan la API, al guardar y al leer, y el website, para mostrar los gramos
 * antes de guardar.
 *
 * - **Gramos por kilo a gramos:** g/kg × kg, redondeado al gramo, la mitad hacia arriba (1,6 g/kg con 78 kg son 125 g).
 *   La cuenta es con enteros: los g/kg con hasta dos decimales y el peso con uno, sin errores de coma flotante.
 * - **Lo desconocido nunca es cero:** un límite sin escribir es `null` (no hay límite de ese lado), y un valor que no se
 *   entiende (vacío, negativo, con más decimales de los que se aceptan) no se convierte: se rechaza con su lugar.
 * - **Lo guardado no se mueve:** leer devuelve los gramos tal como se guardaron. Un peso más nuevo solo se avisa
 *   (`pesoMasNuevo`) y se usa si el profesional lo pide, al volver a guardar.
 * - **Sin permiso, sin peso:** si los gramos salieron de un peso registrado que el profesional ya no puede ver, se
 *   devuelven los gramos y se retienen el peso y los gramos por kilo, de los que se lo podría deducir.
 * - **Lo que no se toca queda como estaba:** un rango que vuelve con los mismos gramos guardados no se vuelve a rechazar
 *   por los topes y, con el peso retenido, conserva sus g/kg y el peso del que salieron.
 */
import type { ValidationIssue } from './contratos';
import {
  MACROS_DEL_RANGO,
  type PesoDeReferencia,
  type PesoRegistrado,
  type Rango,
  type RangoDeMacro,
  type RangoDeMacroEntrada,
  type RangoEntrada,
  type RangosDeDiaTipo,
  type RangosDeDiaTipoEntrada,
  type TomaUsada,
} from './contratos-rangos-de-nutricion';

/** Los topes de lo que se escribe. Un valor fuera de estos topes no se guarda; se marca con su lugar. */
export const TOPES_DE_LOS_RANGOS = {
  /** Gramos de un macronutriente en un día tipo o en una comida, con hasta un decimal. */
  gramos: { maximo: 2000, decimales: 1 },
  /** Gramos por kilo, con hasta dos decimales (1,25 g/kg). */
  gramosPorKilo: { maximo: 20, decimales: 2 },
  /** El peso cargado a mano, en kg, con hasta un decimal. */
  peso: { minimo: 20, maximo: 350, decimales: 1 },
} as const;

/** Lo que guarda el plan: los rangos con sus gramos y el peso del que salieron, si alguno va en gramos por kilo. */
export interface ContenidoDeRangos {
  readonly bodyWeight: PesoDeReferencia | null;
  readonly dayTypes: readonly RangosDeDiaTipo[];
}

/**
 * Lo que ya estaba guardado, al escribir. Un macronutriente que vuelve en gramos con los mismos gramos guardados es lo que
 * el profesional no tocó: no se vuelve a rechazar por los topes (en g/kg pudo pasar los 2.000 g). Y si el peso guardado
 * está retenido (`pesoRetenido`: un peso registrado que este profesional ya no puede ver) y no se pide otro, conserva sus
 * g/kg y el peso del que salieron: el profesional no los ve, y por eso los manda en gramos.
 */
export interface LoGuardado {
  readonly contenido: ContenidoDeRangos | null;
  readonly pesoRetenido: boolean;
}

/** Los días tipo y las comidas del borrador, por su identidad: los rangos solo se escriben sobre lo que existe. */
export interface NodosDelPlan {
  readonly dayTypeId: string;
  readonly mealIds: readonly string[];
}

/**
 * Un número con hasta `decimales` decimales, como entero escalado (1,25 con dos decimales es 125); `null` si no es un
 * número finito, si es negativo o si tiene más decimales.
 */
export function escalado(n: unknown, decimales: number): number | null {
  if (typeof n !== 'number' || !Number.isFinite(n) || n < 0) return null;
  const factor = 10 ** decimales;
  const entero = Math.round(n * factor);
  return Math.abs(entero - n * factor) < 1e-6 ? entero : null;
}

/** g/kg × kg, en gramos enteros, la mitad hacia arriba. `null` si falta o no se entiende alguno de los dos. */
export function gramosDesdeGramosPorKilo(gramosPorKilo: number | null | undefined, pesoKg: number | null | undefined): number | null {
  const a = escalado(gramosPorKilo, TOPES_DE_LOS_RANGOS.gramosPorKilo.decimales);
  const b = escalado(pesoKg, TOPES_DE_LOS_RANGOS.peso.decimales);
  if (a === null || b === null) return null;
  // a tiene dos decimales y b uno: el producto está en milésimas de gramo.
  return Math.floor((a * b + 500) / 1000);
}

/**
 * El peso registrado, al décimo de kilo (la mitad hacia arriba), que es con lo que se hace la cuenta: una toma de
 * 72,35 kg se usa como 72,4 kg, y así se dice. `null` si no es un peso positivo.
 */
export function pesoAlDecimo(kg: number): number | null {
  if (!Number.isFinite(kg) || kg <= 0) return null;
  // Las tomas guardan hasta cuatro decimales: el margen absorbe el error de coma flotante de n × 10.
  return Math.floor(kg * 10 + 0.5 + 1e-7) / 10;
}

/** Lo que tiene de malo un peso cargado a mano: fuera de los topes, con más de un decimal o con una fecha futura. */
export function problemasDelPesoManual(valueKg: number, measuredOn: string, hoy: string, path = 'bodyWeight'): ValidationIssue[] {
  const t = TOPES_DE_LOS_RANGOS.peso;
  const issues: ValidationIssue[] = [];
  if (escalado(valueKg, t.decimales) === null || valueKg < t.minimo || valueKg > t.maximo) issues.push({ code: 'BODY_WEIGHT_OUT_OF_BOUNDS', path: `${path}.valueKg` });
  if (measuredOn > hoy) issues.push({ code: 'BODY_WEIGHT_DATE_IN_FUTURE', path: `${path}.measuredOn` });
  return issues;
}

const usaGramosPorKilo = (r: RangoEntrada | null): boolean => !!r && MACROS_DEL_RANGO.some((m) => r[m]?.unit === 'g_per_kg');

/** Cómo se escribe: el peso, si se conservan los g/kg de un peso retenido, los problemas y cuántos se conservaron. */
interface Escritura {
  readonly peso: PesoDeReferencia | null;
  readonly conservarRetenido: boolean;
  readonly issues: ValidationIssue[];
  conservados: number;
}

/** Un macronutriente escrito, convertido a lo que guarda el plan, o sus problemas. */
function macroParaGuardar(m: RangoDeMacroEntrada, previo: RangoDeMacro | undefined, path: string, e: Escritura): RangoDeMacro | null {
  const { issues, peso } = e;
  if (m.min === null && m.max === null) {
    issues.push({ code: 'RANGE_BOUND_REQUIRED', path });
    return null;
  }
  // Lo que no se tocó: vuelve en gramos, con los mismos gramos guardados.
  const sinTocar = m.unit === 'g' && !!previo && previo.grams.min === m.min && previo.grams.max === m.max;
  if (sinTocar && e.conservarRetenido && previo.unit === 'g_per_kg') {
    e.conservados += 1;
    return previo;
  }
  const tope = m.unit === 'g' ? TOPES_DE_LOS_RANGOS.gramos : TOPES_DE_LOS_RANGOS.gramosPorKilo;
  let bien = true;
  for (const lado of ['min', 'max'] as const) {
    const v = m[lado];
    if (v !== null && (escalado(v, tope.decimales) === null || (v > tope.maximo && !sinTocar))) {
      issues.push({ code: 'RANGE_VALUE_OUT_OF_BOUNDS', path: `${path}.${lado}` });
      bien = false;
    }
  }
  if (m.min !== null && m.max !== null && m.min > m.max) {
    issues.push({ code: 'RANGE_MIN_ABOVE_MAX', path });
    bien = false;
  }
  if (!bien) return null;
  if (m.unit === 'g') return { unit: 'g', perKg: null, grams: { min: m.min, max: m.max } };
  if (!peso) return null; // BODY_WEIGHT_REQUIRED ya quedó dicho una vez, en `bodyWeight`.
  return {
    unit: 'g_per_kg',
    perKg: { min: m.min, max: m.max },
    grams: { min: m.min === null ? null : gramosDesdeGramosPorKilo(m.min, peso.valueKg), max: m.max === null ? null : gramosDesdeGramosPorKilo(m.max, peso.valueKg) },
  };
}

function rangoParaGuardar(r: RangoEntrada, previo: Rango | null | undefined, path: string, e: Escritura): Rango | null {
  const presentes = MACROS_DEL_RANGO.filter((m) => r[m] !== undefined);
  if (presentes.length === 0) {
    e.issues.push({ code: 'RANGE_EMPTY', path });
    return null;
  }
  const salida: { -readonly [M in (typeof MACROS_DEL_RANGO)[number]]?: RangoDeMacro } = {};
  for (const m of presentes) {
    const guardado = macroParaGuardar(r[m]!, previo?.[m], `${path}.${m}`, e);
    if (guardado) salida[m] = guardado;
  }
  return salida;
}

/**
 * API-PLN-03 · Los rangos escritos, convertidos a lo que guarda el plan: los gramos de cada uno y el peso del que
 * salieron. El peso solo se guarda si algún macronutriente va en gramos por kilo. Un rango sobre un día tipo o una comida
 * que el borrador no tiene, repetido, vacío o con un valor que no se entiende, no se guarda: vuelven todos los problemas,
 * cada uno con su lugar. Lo que no se tocó: ver `LoGuardado`.
 */
export function rangosParaGuardar(
  dias: readonly RangosDeDiaTipoEntrada[],
  peso: PesoDeReferencia | null,
  nodos: readonly NodosDelPlan[],
  loGuardado: LoGuardado = { contenido: null, pesoRetenido: false },
): { readonly ok: true; readonly contenido: ContenidoDeRangos } | { readonly ok: false; readonly issues: readonly ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  const conGramosPorKilo = dias.some((d) => usaGramosPorKilo(d.day) || d.meals.some((m) => usaGramosPorKilo(m.range)));
  if (conGramosPorKilo && !peso) issues.push({ code: 'BODY_WEIGHT_REQUIRED', path: 'bodyWeight' });
  const pesoUsado = conGramosPorKilo ? peso : null;
  const e: Escritura = { peso: pesoUsado, conservarRetenido: loGuardado.pesoRetenido && !peso && !!loGuardado.contenido?.bodyWeight, issues, conservados: 0 };
  const vistos = new Set<string>();
  const salida: RangosDeDiaTipo[] = [];
  dias.forEach((d, i) => {
    const path = `dayTypes.${i}`;
    const nodo = nodos.find((n) => n.dayTypeId === d.dayTypeId);
    if (!nodo) return void issues.push({ code: 'RANGE_TARGET_NOT_IN_PLAN', path: `${path}.dayTypeId` });
    if (vistos.has(d.dayTypeId)) return void issues.push({ code: 'RANGE_TARGET_REPEATED', path: `${path}.dayTypeId` });
    vistos.add(d.dayTypeId);
    const previo = loGuardado.contenido?.dayTypes.find((x) => x.dayTypeId === d.dayTypeId);
    const day = d.day ? rangoParaGuardar(d.day, previo?.day, `${path}.day`, e) : null;
    const comidasVistas = new Set<string>();
    const meals: { mealId: string; range: Rango }[] = [];
    d.meals.forEach((m, j) => {
      const lugar = `${path}.meals.${j}`;
      if (!nodo.mealIds.includes(m.mealId)) return void issues.push({ code: 'RANGE_TARGET_NOT_IN_PLAN', path: `${lugar}.mealId` });
      if (comidasVistas.has(m.mealId)) return void issues.push({ code: 'RANGE_TARGET_REPEATED', path: `${lugar}.mealId` });
      comidasVistas.add(m.mealId);
      const range = rangoParaGuardar(m.range, previo?.meals.find((x) => x.mealId === m.mealId)?.range, `${lugar}.range`, e);
      if (range) meals.push({ mealId: m.mealId, range });
    });
    if (day || meals.length > 0) salida.push({ dayTypeId: d.dayTypeId, day, meals });
  });
  // Con algo conservado de un peso retenido, sigue anotado el peso del que salió; sin nada en g/kg, no hay peso.
  const bodyWeight = pesoUsado ?? (e.conservados > 0 ? loGuardado.contenido!.bodyWeight : null);
  return issues.length > 0 ? { ok: false, issues } : { ok: true, contenido: { bodyWeight, dayTypes: salida } };
}

const sinPorKilo = (r: Rango): Rango => Object.fromEntries(Object.entries(r).map(([m, v]) => [m, { ...v, perKg: null }])) as Rango;

/**
 * API-PLN-02 · Lo guardado, tal como se lee: los gramos no se recalculan nunca. Se quitan los rangos de los días tipo y
 * las comidas que el borrador ya no tiene. Si los gramos salieron de un peso registrado que el profesional no puede ver
 * (`puedeVerElPesoRegistrado` en `false`), se retienen el peso y los gramos por kilo.
 */
export function rangosParaMostrar(
  contenido: ContenidoDeRangos | null,
  nodos: readonly NodosDelPlan[],
  puedeVerElPesoRegistrado: boolean,
): { readonly bodyWeight: PesoDeReferencia | null; readonly bodyWeightWithheld: boolean; readonly dayTypes: readonly RangosDeDiaTipo[] } {
  if (!contenido) return { bodyWeight: null, bodyWeightWithheld: false, dayTypes: [] };
  const retenido = contenido.bodyWeight?.source === 'RECORDED' && !puedeVerElPesoRegistrado;
  const ver = (r: Rango): Rango => (retenido ? sinPorKilo(r) : r);
  const dayTypes = contenido.dayTypes.flatMap((d) => {
    const nodo = nodos.find((n) => n.dayTypeId === d.dayTypeId);
    if (!nodo) return [];
    const meals = d.meals.filter((m) => nodo.mealIds.includes(m.mealId)).map((m) => ({ mealId: m.mealId, range: ver(m.range) }));
    return d.day || meals.length > 0 ? [{ dayTypeId: d.dayTypeId, day: d.day ? ver(d.day) : null, meals }] : [];
  });
  return { bodyWeight: retenido ? null : contenido.bodyWeight, bodyWeightWithheld: retenido, dayTypes };
}

/**
 * El peso registrado más nuevo que el usado, para avisar en neutro «hay un peso más nuevo (80 kg del 12/11)». `null` si no
 * hay uno, si es el mismo o si es más viejo. Avisar no cambia nada: recalcular es una decisión del profesional.
 */
export function pesoMasNuevo(usado: PesoDeReferencia | null, ultimo: PesoRegistrado | null): PesoRegistrado | null {
  if (!usado || !ultimo) return null;
  if (usado.source === 'RECORDED') return ultimo.measurementId !== usado.measurementId && ultimo.measuredOn >= usado.measuredOn ? ultimo : null;
  return ultimo.measuredOn > usado.measuredOn ? ultimo : null;
}

/** Lo que cambió del peso que usa el plan, para avisarlo en neutro. Ninguna novedad cambia lo guardado. */
export type NovedadDelPeso =
  /** La toma que usa el plan se corrigió en Antropometría: hoy vale `valueKg`. */
  | { readonly tipo: 'corregido'; readonly valueKg: number }
  /** La toma que usa el plan ya no está vigente: se anuló, o su valor ya no está en kg. */
  | { readonly tipo: 'no-vigente' }
  /** Hay un peso registrado más nuevo que el usado. */
  | { readonly tipo: 'mas-nuevo'; readonly peso: PesoRegistrado };

/**
 * Las novedades del peso que usa el plan: la toma usada se corrigió o ya no está vigente, o hay un peso más nuevo. Sin
 * novedades, una lista vacía. Avisar no cambia nada: recalcular es una decisión del profesional.
 */
export function novedadesDelPeso(usado: PesoDeReferencia | null, tomaUsada: TomaUsada | null, ultimo: PesoRegistrado | null): NovedadDelPeso[] {
  const novedades: NovedadDelPeso[] = [];
  if (usado?.source === 'RECORDED' && tomaUsada) {
    if (tomaUsada.state === 'NOT_CURRENT') novedades.push({ tipo: 'no-vigente' });
    else if (tomaUsada.valueKg !== usado.valueKg) novedades.push({ tipo: 'corregido', valueKg: tomaUsada.valueKg });
  }
  const nuevo = pesoMasNuevo(usado, ultimo);
  if (nuevo) novedades.push({ tipo: 'mas-nuevo', peso: nuevo });
  return novedades;
}

/** Los días tipo y las comidas de una estructura con identidades, para validar y filtrar los rangos. */
export function nodosDelPlan(dias: readonly { readonly dayTypeId: string; readonly meals: readonly { readonly mealId: string }[] }[]): NodosDelPlan[] {
  return dias.map((d) => ({ dayTypeId: d.dayTypeId, mealIds: d.meals.map((m) => m.mealId) }));
}
