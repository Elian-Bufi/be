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
  novedadesDelPeso,
  problemasDelPesoManual,
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
  type ValidationIssue,
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

/** Lo que tiene de malo el peso a mano, en palabras, junto a cada campo; `null` en el que está bien o vacío. */
export interface ProblemasDelPesoAMano {
  readonly kg: string | null;
  readonly fecha: string | null;
}

/**
 * El peso a mano, con las mismas reglas que la API (`problemasDelPesoManual`): entre 20 y 350 kg, con hasta un decimal, y
 * sin fecha futura. Una balanza que da 72,35 se escribe 72,4. Lo vacío no es un problema del campo: apaga «Guardar».
 */
export function problemasDelPesoAMano(elegido: PesoElegido, hoy: string): ProblemasDelPesoAMano {
  if (elegido.tipo !== 'a-mano') return { kg: null, fecha: null };
  const t = TOPES_DE_LOS_RANGOS.peso;
  const kg = leerNumero(elegido.kg);
  let problemaKg: string | null = null;
  if (kg !== null && Number.isNaN(kg)) problemaKg = 'Escribí un número, por ejemplo 72,4.';
  else if (kg !== null && problemasDelPesoManual(kg, hoy, hoy).length > 0) {
    problemaKg = kg >= t.minimo && kg <= t.maximo ? 'Hasta un decimal: por ejemplo 72,4.' : `Entre ${numero(t.minimo)} y ${numero(t.maximo)} kg.`;
  }
  const fecha = elegido.fecha && problemasDelPesoManual(t.minimo, elegido.fecha, hoy).length > 0 ? 'La fecha no puede ser posterior a hoy.' : null;
  return { kg: problemaKg, fecha };
}

/** El peso con el que se hace la cuenta, en kg; `null` si no hay uno elegido o el escrito no se entiende o no vale. */
export function kilosDelPeso(elegido: PesoElegido, guardado: PesoDeReferencia | null, ultimo: PesoRegistrado | null): number | null {
  if (elegido.tipo === 'guardado') return guardado?.valueKg ?? null;
  if (elegido.tipo === 'registrado') return ultimo?.valueKg ?? null;
  const kg = leerNumero(elegido.kg);
  return kg === null || Number.isNaN(kg) || problemasDelPesoAMano(elegido, '9999-12-31').kg ? null : kg;
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

/**
 * Los avisos neutros del peso que usa el plan: la toma se corrigió («La toma del 10/11 se corrigió: hoy dice 87 kg.»), ya
 * no está vigente, o hay un peso más nuevo («Hay un peso más nuevo (80 kg del 12/11).»). Ninguno cambia lo guardado.
 */
export function avisosDelPeso(datos: Pick<RangosDelPlan, 'bodyWeight' | 'anthropometry'>): string[] {
  const usado = datos.bodyWeight;
  return novedadesDelPeso(usado, datos.anthropometry.usedMeasurement, datos.anthropometry.latestWeight).map((n) => {
    if (n.tipo === 'corregido') return `La toma del ${diaYMes(usado!.measuredOn)} se corrigió en Antropometría: hoy dice ${numero(n.valueKg)} kg. Lo guardado no cambia: para usar el valor de hoy, abrí un rango y elegilo.`;
    if (n.tipo === 'no-vigente') return `La toma del ${diaYMes(usado!.measuredOn)} ya no está vigente en Antropometría. Lo guardado no cambia: para usar otro peso, abrí un rango y elegilo.`;
    return `Hay un peso más nuevo (${numero(n.peso.valueKg)} kg del ${diaYMes(n.peso.measuredOn)}). Lo guardado no cambia: para usarlo, abrí un rango y elegilo.`;
  });
}

/**
 * Las opciones del peso en el cuadro: el que usa el plan; el último registrado, si es otra toma o si la misma vale hoy
 * otra cosa (se corrigió); y uno a mano.
 */
export function opcionesDelPeso(datos: Pick<RangosDelPlan, 'bodyWeight' | 'anthropometry'>): { readonly valor: PesoElegido['tipo']; readonly texto: string }[] {
  const usado = datos.bodyWeight;
  const ultimo = datos.anthropometry.latestWeight;
  const opciones: { valor: PesoElegido['tipo']; texto: string }[] = [];
  if (usado) opciones.push({ valor: 'guardado', texto: COPY_RANGOS_INDICADOS.pesoGuardado(pesoEnPalabras(usado)) });
  if (ultimo && ultimo.measurementId !== usado?.measurementId) opciones.push({ valor: 'registrado', texto: COPY_RANGOS_INDICADOS.pesoRegistrado(ultimo.valueKg, ultimo.measuredOn) });
  else if (ultimo && usado && ultimo.valueKg !== usado.valueKg) opciones.push({ valor: 'registrado', texto: COPY_RANGOS_INDICADOS.pesoCorregido(ultimo.valueKg, ultimo.measuredOn) });
  opciones.push({ valor: 'a-mano', texto: COPY_RANGOS_INDICADOS.pesoAMano });
  return opciones;
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

/**
 * El peso que se manda: el guardado (por su medición, que la API conserva tal cual, o el de a mano), el último registrado
 * con su valor de hoy (`useCurrentValue`: también si es la misma toma, corregida) o uno a mano que valga.
 */
export function pesoParaMandar(elegido: PesoElegido, guardado: PesoDeReferencia | null, ultimo: PesoRegistrado | null, hoy = '9999-12-31'): EscribirRangosRequest['bodyWeight'] {
  if (elegido.tipo === 'guardado') {
    if (!guardado) return null;
    return guardado.source === 'RECORDED' && guardado.measurementId ? { source: 'RECORDED', measurementId: guardado.measurementId } : { source: 'MANUAL', valueKg: guardado.valueKg, measuredOn: guardado.measuredOn };
  }
  if (elegido.tipo === 'registrado') return ultimo ? { source: 'RECORDED', measurementId: ultimo.measurementId, useCurrentValue: true } : null;
  const kg = leerNumero(elegido.kg);
  const p = problemasDelPesoAMano(elegido, hoy);
  return kg === null || Number.isNaN(kg) || !elegido.fecha || p.kg || p.fecha ? null : { source: 'MANUAL', valueKg: kg, measuredOn: elegido.fecha };
}

/** Lo que manda el cuadro al guardar, o por qué «Guardar» está apagado. */
export type GuardadoDelCuadro = { readonly cuerpo: EscribirRangosRequest; readonly apagado: null } | { readonly cuerpo: null; readonly apagado: string };

/**
 * El guardado del cuadro, sin React. El peso depende del cuerpo entero, no solo del rango abierto: si el rango abierto va
 * en g/kg, el peso elegido; si no, el que ya usa el plan, para los demás rangos en g/kg que vuelven tal cual. Así guardar
 * un rango en gramos nunca deja sin peso a los demás.
 */
export function guardadoDelCuadro(
  datos: Pick<RangosDelPlan, 'revision' | 'dayTypes' | 'bodyWeight' | 'anthropometry'>,
  donde: DondeVaElRango,
  form: FormularioDelRango,
  elegido: PesoElegido,
  hoy: string,
): GuardadoDelCuadro {
  const C = COPY_RANGOS_INDICADOS;
  if (MACROS_DEL_RANGO.some((m) => problemaDelCampo(form[m], 'min') || problemaDelCampo(form[m], 'max'))) return { cuerpo: null, apagado: C.hayQueCorregir };
  const conGramosPorKilo = usaGramosPorKilo(form);
  if (conGramosPorKilo) {
    const p = problemasDelPesoAMano(elegido, hoy);
    if (p.kg || p.fecha) return { cuerpo: null, apagado: C.revisaElPeso };
  }
  const peso = conGramosPorKilo ? pesoParaMandar(elegido, datos.bodyWeight, datos.anthropometry.latestWeight, hoy) : pesoParaMandar({ tipo: 'guardado' }, datos.bodyWeight, null);
  const cuerpo = cuerpoParaGuardar(datos, donde, rangoDelFormulario(form), peso);
  const algoEnGramosPorKilo = cuerpo.dayTypes.some((d) => [d.day, ...d.meals.map((m) => m.range)].some((r) => r && MACROS_DEL_RANGO.some((m) => r[m]?.unit === 'g_per_kg')));
  if (algoEnGramosPorKilo && !cuerpo.bodyWeight) return { cuerpo: null, apagado: C.faltaElPeso };
  return { cuerpo, apagado: null };
}

/**
 * Los problemas que devolvió la API, llevados a su campo del cuadro por su `path`: `protein.min`, `kg`, `fecha`. Los
 * que no son de un campo del cuadro quedan en `otros`.
 */
export function problemasEnSuCampo(issues: readonly ValidationIssue[], cuerpo: EscribirRangosRequest, donde: DondeVaElRango): { readonly campos: Readonly<Record<string, string>>; readonly otros: number } {
  const C = COPY_RANGOS_INDICADOS;
  const i = cuerpo.dayTypes.findIndex((d) => d.dayTypeId === donde.dayTypeId);
  const j = i < 0 || donde.mealId === null ? -1 : cuerpo.dayTypes[i]!.meals.findIndex((m) => m.mealId === donde.mealId);
  const prefijo = donde.mealId === null ? `dayTypes.${i}.day.` : `dayTypes.${i}.meals.${j}.range.`;
  const campos: Record<string, string> = {};
  let otros = 0;
  for (const issue of issues) {
    const texto = C.problemaDeLaApi[issue.code as keyof typeof C.problemaDeLaApi];
    let campo: string | null = null;
    if (issue.path === 'bodyWeight.valueKg') campo = 'kg';
    else if (issue.path === 'bodyWeight.measuredOn') campo = 'fecha';
    else if (i >= 0 && (donde.mealId === null || j >= 0) && issue.path.startsWith(prefijo)) {
      const [macro, lado] = issue.path.slice(prefijo.length).split('.');
      if (MACROS_DEL_RANGO.includes(macro as MacroDelRango)) campo = `${macro}.${lado === 'min' ? 'min' : 'max'}`;
    }
    if (campo && texto) campos[campo] ??= texto;
    else otros += 1;
  }
  return { campos, otros };
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
  revisaElPeso: 'Para pasar a gramos, revisá el peso.',
  hayQueCorregir: 'Hay un valor por corregir.',
  peso: 'Peso de referencia',
  pesoGuardado: (texto: string) => `El que usa el plan: ${texto.replace(/^Con /, '')}`,
  pesoRegistrado: (kg: number, fecha: string) => `El último registrado en Antropometría: ${numero(kg)} kg del ${diaYMes(fecha)}`,
  pesoCorregido: (kg: number, fecha: string) => `La misma toma, con su corrección: ${numero(kg)} kg del ${diaYMes(fecha)}`,
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
  revisaLoMarcado: 'No se guardó: revisá lo marcado.',
  faltoElPesoDelPlan: 'Faltó el peso de los rangos en g/kg: se volvieron a leer. Revisá y guardá de nuevo.',
  /** Los problemas que devuelve la API, junto a su campo. */
  problemaDeLaApi: {
    BODY_WEIGHT_OUT_OF_BOUNDS: 'Entre 20 y 350 kg, con hasta un decimal.',
    BODY_WEIGHT_DATE_IN_FUTURE: 'La fecha no puede ser posterior a hoy.',
    RANGE_VALUE_OUT_OF_BOUNDS: 'Este valor está fuera de lo que se acepta.',
    RANGE_MIN_ABOVE_MAX: 'El máximo es menor que el mínimo.',
  },
  soloLectura: 'La versión está activada: sus rangos quedan como se activaron.',
} as const;
