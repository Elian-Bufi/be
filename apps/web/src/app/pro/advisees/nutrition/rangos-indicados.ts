/**
 * API-PLN-02 y API-PLN-03 en el editor de Nutrición (ED-34; decisión de Dirección del 2026-11-13, «Último peso, guardado
 * en gramos») · Los rangos que indica el profesional, sin React: el formulario, la cuenta en vivo y los textos.
 *
 * - **Por macronutriente, «g» o «g/kg»:** con g/kg se ve el peso usado y de dónde salió, y los gramos que resultan, que
 *   son los que se guardan. La cuenta es la del dominio (`gramosDesdeGramosPorKilo`): la misma que hace la API.
 * - **El peso:** el último registrado, si la persona habilitó Antropometría para este profesional; si no, o si no hay,
 *   uno a mano. Lo guardado no se mueve: un peso más nuevo se avisa en neutro y se usa solo si el profesional lo elige.
 * - **Lo vacío es «sin límite», nunca cero;** lo que no se entiende se marca en su campo y no se guarda.
 * - **Las kcal no se escriben acá:** las de cada opción siguen saliendo de la fuente de cada alimento.
 * - Se describe, no se califica: sin colores ni palabras de juicio, y sin el signo de proporción (DJ-7).
 */
import {
  gramosDesdeGramosPorKilo,
  MACROS_DEL_RANGO,
  pesoMasNuevo,
  TOPES_DE_LOS_RANGOS,
  type EscribirRangosRequest,
  type MacroDelRango,
  type PesoDeReferencia,
  type PesoRegistrado,
  type Rango,
  type RangoDeMacro,
  type RangoEntrada,
  type RangosDeDiaTipo,
  type RangosDelPlan,
  type UnidadDeRango,
} from '@be/domain';

export interface CampoDeMacro {
  readonly unidad: UnidadDeRango;
  readonly min: string;
  readonly max: string;
}
export type FormularioDelRango = Readonly<Record<MacroDelRango, CampoDeMacro>>;

/** El peso elegido en el cuadro: el guardado, el último registrado o uno a mano. */
export type PesoElegido =
  | { readonly tipo: 'guardado' }
  | { readonly tipo: 'registrado' }
  | { readonly tipo: 'a-mano'; readonly kg: string; readonly fecha: string };

export const NOMBRE_DEL_MACRO: Readonly<Record<MacroDelRango, string>> = { protein: 'Proteínas', carbohydrate: 'Carbohidratos', fat: 'Grasas' };
const INICIAL_DEL_MACRO: Readonly<Record<MacroDelRango, string>> = { protein: 'P', carbohydrate: 'C', fat: 'G' };
export const NOMBRE_DE_LA_UNIDAD: Readonly<Record<UnidadDeRango, string>> = { g: 'g', g_per_kg: 'g/kg' };

const numero = (n: number): string => n.toLocaleString('es-AR', { maximumFractionDigits: 2 });
/** «10/11» desde «2026-11-10». */
export const diaYMes = (fecha: string): string => `${fecha.slice(8, 10)}/${fecha.slice(5, 7)}`;

/** Lo escrito en un campo: vacío es «sin límite» (`null`); «1,6» es 1,6; lo que no se entiende es `NaN`, nunca cero. */
export function leerNumero(texto: string): number | null {
  const t = texto.trim().replace(',', '.');
  if (t === '') return null;
  return /^\d+(\.\d+)?$/.test(t) ? Number(t) : Number.NaN;
}

const vacio = (): CampoDeMacro => ({ unidad: 'g', min: '', max: '' });
const enCampo = (n: number | null): string => (n === null ? '' : numero(n).replace(/\./g, ''));

/**
 * El formulario de un rango guardado. En g/kg, lo escrito en g/kg; si el peso está retenido (Antropometría ya no está
 * habilitada), los gramos guardados, en «g»: los g/kg no se pueden mostrar.
 */
export function formularioDesde(rango: Rango | null | undefined): FormularioDelRango {
  const campo = (m: RangoDeMacro | undefined): CampoDeMacro => {
    if (!m) return vacio();
    if (m.unit === 'g_per_kg' && m.perKg) return { unidad: 'g_per_kg', min: enCampo(m.perKg.min), max: enCampo(m.perKg.max) };
    return { unidad: 'g', min: enCampo(m.grams.min), max: enCampo(m.grams.max) };
  };
  return { protein: campo(rango?.protein), carbohydrate: campo(rango?.carbohydrate), fat: campo(rango?.fat) };
}

/** Lo que tiene de malo un campo, en palabras; `null` si está bien. */
export function problemaDelCampo(c: CampoDeMacro, lado: 'min' | 'max'): string | null {
  const v = leerNumero(c[lado]);
  if (v === null) return null;
  const tope = c.unidad === 'g' ? TOPES_DE_LOS_RANGOS.gramos : TOPES_DE_LOS_RANGOS.gramosPorKilo;
  if (Number.isNaN(v)) return 'Escribí un número, por ejemplo 1,6.';
  const decimales = (c[lado].trim().replace(',', '.').split('.')[1] ?? '').length;
  if (decimales > tope.decimales) return tope.decimales === 1 ? 'Hasta un decimal.' : 'Hasta dos decimales.';
  if (v > tope.maximo) return `Hasta ${numero(tope.maximo)} ${NOMBRE_DE_LA_UNIDAD[c.unidad]}.`;
  if (lado === 'max') {
    const min = leerNumero(c.min);
    if (min !== null && !Number.isNaN(min) && min > v) return 'El máximo es menor que el mínimo.';
  }
  return null;
}

/** El peso con el que se hace la cuenta, en kg; `null` si no hay uno elegido o el escrito no se entiende. */
export function kilosDelPeso(elegido: PesoElegido, guardado: PesoDeReferencia | null, ultimo: PesoRegistrado | null): number | null {
  if (elegido.tipo === 'guardado') return guardado?.valueKg ?? null;
  if (elegido.tipo === 'registrado') return ultimo?.valueKg ?? null;
  const kg = leerNumero(elegido.kg);
  return kg === null || Number.isNaN(kg) ? null : kg;
}

/** Los gramos que resultan de un campo, para mostrarlos antes de guardar: «125 a 156 g», «desde 125 g», «hasta 25 g». */
export function gramosQueResultan(c: CampoDeMacro, kg: number | null): string | null {
  const lado = (texto: string): number | null | 'nada' => {
    const v = leerNumero(texto);
    if (v === null) return 'nada';
    if (Number.isNaN(v)) return null;
    return c.unidad === 'g' ? v : gramosDesdeGramosPorKilo(v, kg);
  };
  const min = lado(c.min);
  const max = lado(c.max);
  if (min === null || max === null || (min === 'nada' && max === 'nada')) return null;
  return limitesEnPalabras(min === 'nada' ? null : min, max === 'nada' ? null : max, 'g');
}

function limitesEnPalabras(min: number | null, max: number | null, unidad: string): string {
  if (min !== null && max !== null) return min === max ? `${numero(min)} ${unidad}` : `${numero(min)} a ${numero(max)} ${unidad}`;
  if (min !== null) return `desde ${numero(min)} ${unidad}`;
  return `hasta ${numero(max as number)} ${unidad}`;
}

/** Un rango guardado en una línea: «P 125 a 156 g · C desde 250 g · G hasta 25 g». */
export function rangoEnUnaLinea(r: Rango): string {
  return MACROS_DEL_RANGO.flatMap((m) => {
    const v = r[m];
    return v ? [`${INICIAL_DEL_MACRO[m]} ${limitesEnPalabras(v.grams.min, v.grams.max, 'g')}`] : [];
  }).join(' · ');
}

/** Lo mismo, con los nombres completos y lo escrito en g/kg, para el lector de pantalla y el detalle. */
export function rangoEnPalabras(r: Rango): string {
  return MACROS_DEL_RANGO.flatMap((m) => {
    const v = r[m];
    if (!v) return [];
    const porKilo = v.unit === 'g_per_kg' && v.perKg ? ` (${limitesEnPalabras(v.perKg.min, v.perKg.max, 'g/kg')})` : '';
    return [`${NOMBRE_DEL_MACRO[m]} ${limitesEnPalabras(v.grams.min, v.grams.max, 'g')}${porKilo}`];
  }).join(' · ');
}

/** «Con 78 kg del 10/11 · el último peso registrado» o «· cargado a mano». */
export function pesoEnPalabras(p: PesoDeReferencia): string {
  return `Con ${numero(p.valueKg)} kg del ${diaYMes(p.measuredOn)} · ${p.source === 'RECORDED' ? 'peso registrado en Antropometría' : 'cargado a mano'}`;
}

/** El aviso neutro de un peso más nuevo que el usado: «Hay un peso más nuevo (80 kg del 12/11).» `null` si no lo hay. */
export function avisoDePesoMasNuevo(datos: Pick<RangosDelPlan, 'bodyWeight' | 'anthropometry'>): string | null {
  const nuevo = pesoMasNuevo(datos.bodyWeight, datos.anthropometry.latestWeight);
  return nuevo ? `Hay un peso más nuevo (${numero(nuevo.valueKg)} kg del ${diaYMes(nuevo.measuredOn)}). Lo guardado no cambia: para usarlo, abrí un rango y elegilo.` : null;
}

/** ¿Algún macronutriente del formulario va en g/kg con algo escrito? */
export const usaGramosPorKilo = (f: FormularioDelRango): boolean => MACROS_DEL_RANGO.some((m) => f[m].unidad === 'g_per_kg' && (f[m].min.trim() !== '' || f[m].max.trim() !== ''));

/** El formulario como lo pide la API: solo los macronutrientes con algo escrito. `null` si no queda ninguno. */
export function rangoDelFormulario(f: FormularioDelRango): RangoEntrada | null {
  const salida: { -readonly [M in MacroDelRango]?: RangoEntrada[M] } = {};
  for (const m of MACROS_DEL_RANGO) {
    const c = f[m];
    const min = leerNumero(c.min);
    const max = leerNumero(c.max);
    if (min === null && max === null) continue;
    salida[m] = { unit: c.unidad, min, max };
  }
  return Object.keys(salida).length > 0 ? salida : null;
}

/** Un rango guardado, como lo pide la API para volver a escribirlo igual (con el peso retenido, en gramos). */
function entradaDesde(r: Rango): RangoEntrada {
  const salida: { -readonly [M in MacroDelRango]?: RangoEntrada[M] } = {};
  for (const m of MACROS_DEL_RANGO) {
    const v = r[m];
    if (!v) continue;
    salida[m] = v.unit === 'g_per_kg' && v.perKg ? { unit: 'g_per_kg', min: v.perKg.min, max: v.perKg.max } : { unit: 'g', min: v.grams.min, max: v.grams.max };
  }
  return salida;
}

/** A qué se le escribe el rango: el día tipo entero (`mealId` en `null`) o una de sus comidas. */
export interface DondeVaElRango {
  readonly dayTypeId: string;
  readonly mealId: string | null;
}

/**
 * El cuerpo de API-PLN-03: todos los rangos guardados, tal cual, con el de `donde` reemplazado (o quitado, con `null`).
 * El peso: el elegido, si algo va en g/kg.
 */
export function cuerpoParaGuardar(
  datos: Pick<RangosDelPlan, 'revision' | 'dayTypes' | 'bodyWeight'>,
  donde: DondeVaElRango,
  rango: RangoEntrada | null,
  peso: EscribirRangosRequest['bodyWeight'],
): EscribirRangosRequest {
  const dias: { dayTypeId: string; day: RangoEntrada | null; meals: { mealId: string; range: RangoEntrada }[] }[] = datos.dayTypes.map((d: RangosDeDiaTipo) => ({
    dayTypeId: d.dayTypeId,
    day: d.day ? entradaDesde(d.day) : null,
    meals: d.meals.map((m) => ({ mealId: m.mealId, range: entradaDesde(m.range) })),
  }));
  let dia = dias.find((d) => d.dayTypeId === donde.dayTypeId);
  if (!dia) {
    dia = { dayTypeId: donde.dayTypeId, day: null, meals: [] };
    dias.push(dia);
  }
  if (donde.mealId === null) dia.day = rango;
  else {
    dia.meals = dia.meals.filter((m) => m.mealId !== donde.mealId);
    if (rango) dia.meals.push({ mealId: donde.mealId, range: rango });
  }
  const conAlgo = dias.filter((d) => d.day || d.meals.length > 0);
  const algoEnGramosPorKilo = conAlgo.some((d) => [d.day, ...d.meals.map((m) => m.range)].some((r) => r && MACROS_DEL_RANGO.some((m) => r[m]?.unit === 'g_per_kg')));
  return { expectedRevision: datos.revision, bodyWeight: algoEnGramosPorKilo ? peso : null, dayTypes: conAlgo };
}

/** El peso que se manda: el guardado (por su medición o tal cual, si fue a mano), el último registrado o uno a mano. */
export function pesoParaMandar(elegido: PesoElegido, guardado: PesoDeReferencia | null, ultimo: PesoRegistrado | null): EscribirRangosRequest['bodyWeight'] {
  if (elegido.tipo === 'guardado') {
    if (!guardado) return null;
    return guardado.source === 'RECORDED' && guardado.measurementId ? { source: 'RECORDED', measurementId: guardado.measurementId } : { source: 'MANUAL', valueKg: guardado.valueKg, measuredOn: guardado.measuredOn };
  }
  if (elegido.tipo === 'registrado') return ultimo ? { source: 'RECORDED', measurementId: ultimo.measurementId } : null;
  const kg = leerNumero(elegido.kg);
  return kg === null || Number.isNaN(kg) || !elegido.fecha ? null : { source: 'MANUAL', valueKg: kg, measuredOn: elegido.fecha };
}

/** El peso que se propone al abrir el cuadro: el guardado si hay; si no, el último registrado; si no, a mano. */
export function pesoInicial(datos: Pick<RangosDelPlan, 'bodyWeight' | 'anthropometry'>, hoy: string): PesoElegido {
  if (datos.bodyWeight) return { tipo: 'guardado' };
  if (datos.anthropometry.latestWeight) return { tipo: 'registrado' };
  return { tipo: 'a-mano', kg: '', fecha: hoy };
}

export const COPY_RANGOS_INDICADOS = {
  titulo: 'Rangos indicados',
  ayuda: 'Lo que indicás para el día o para una comida, en gramos o en gramos por kilo. Se guardan los gramos. Las kcal de cada opción siguen saliendo de cada alimento.',
  elDia: 'Todo el día',
  sinRango: 'Sin rango indicado',
  escribir: (donde: string) => `Indicar el rango de ${donde}`,
  cambiar: (donde: string) => `Cambiar el rango de ${donde}`,
  tituloDelCuadro: (donde: string) => `Rango de ${donde}`,
  unidad: (macro: string) => `Unidad de ${macro}`,
  minimo: (macro: string) => `${macro}, mínimo`,
  maximo: (macro: string) => `${macro}, máximo`,
  vacioEsSinLimite: 'Un campo vacío es sin límite de ese lado.',
  resultan: (texto: string) => `Se guardan ${texto}.`,
  faltaElPeso: 'Para pasar a gramos falta el peso.',
  peso: 'Peso de referencia',
  pesoGuardado: (texto: string) => `El que usa el plan: ${texto.replace(/^Con /, '')}`,
  pesoRegistrado: (kg: number, fecha: string) => `El último registrado en Antropometría: ${numero(kg)} kg del ${diaYMes(fecha)}`,
  pesoAMano: 'Cargarlo a mano',
  kilos: 'Peso (kg)',
  fecha: 'Fecha del peso',
  sinAntropometria: 'Antropometría no está habilitada para vos con esta persona: el peso se carga a mano.',
  sinPesoRegistrado: 'No hay un peso registrado en Antropometría: cargalo a mano.',
  pesoRetenido: 'Estos gramos salieron de un peso registrado que ya no tenés habilitado ver. Se muestran en gramos.',
  guardar: 'Guardar el rango',
  guardando: 'Guardando…',
  unPesoParaTodo: 'Es un solo peso para todo el plan: si elegís otro, los demás rangos en g/kg también se pasan a gramos con él.',
  quitar: 'Quitar el rango',
  guardado: 'Rango guardado.',
  quitado: 'Rango quitado.',
  leyendo: 'Leyendo los rangos…',
  noSeLeyeron: 'No se pudieron leer los rangos indicados.',
  reintentar: 'Reintentar',
  guardaPrimero: 'Se puede indicar cuando se guarde la versión en preparación.',
  otroCambio: 'Los rangos o el plan cambiaron mientras escribías: se volvieron a leer. Revisá y guardá de nuevo.',
  pesoViejo: 'Hay un peso registrado más nuevo: se volvió a leer. Elegilo o seguí con el que usa el plan.',
  pesoNoDisponible: 'Ese peso no está disponible: cargalo a mano.',
  noSeGuardo: 'No se pudo guardar el rango. Probá de nuevo.',
  soloLectura: 'La versión está activada: sus rangos quedan como se activaron.',
} as const;
