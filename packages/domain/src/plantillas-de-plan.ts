/**
 * Plantillas del profesional (PF-09; DL-108), la lógica que comparten el website y las pruebas:
 * - **las notas de texto libre** de una estructura (propósito de bloque y microciclo, instrucciones de sesión, nota de
 *   prescripción y notas por serie), cada una con su lugar, para que el profesional las confirme o las vacíe **una por
 *   una** antes de guardar (D-3): una nota puede nombrar a la persona («cuidado con la rodilla de Juan»), y el molde no
 *   debe llevarla;
 * - **vaciar** una nota por su lugar, sin tocar nada más.
 */
import type { EstructuraDePlanDeEntrenamientoEntrada } from './contratos-entrenamiento';
import { nombreDeLaFase } from './copy-entrenamiento';

type Estructura = EstructuraDePlanDeEntrenamientoEntrada;
type Bloque = Estructura['blocks'][number];
type Sesion = NonNullable<Bloque['sessions']>[number];

export interface NotaDeLaEstructura {
  /** Dónde está: `blocks[0].purpose`, `blocks[0].sessions[1].prescriptions[2].sets[0].note`… Sirve para vaciarla. */
  readonly lugar: string;
  /** Qué es, en palabras: «Propósito del bloque «Bloque 1»». */
  readonly rotulo: string;
  readonly texto: string;
}

const tiene = (t: string | null | undefined): t is string => typeof t === 'string' && t.trim().length > 0;

/**
 * Las notas de una sesión. `lugar` es el camino de la sesión en la estructura; vacío cuando la sesión es la raíz (una
 * sesión habitual, DL-109), y entonces los lugares son relativos a ella (`instructions`, `prescriptions[0].note`).
 */
export function notasDeSesion(s: Sesion, lugar: string, contexto: string): NotaDeLaEstructura[] {
  const en = (camino: string): string => (lugar ? `${lugar}.${camino}` : camino);
  const notas: NotaDeLaEstructura[] = [];
  if (tiene(s.instructions)) notas.push({ lugar: en('instructions'), rotulo: `Instrucciones de la sesión «${s.label}»${contexto}`, texto: s.instructions });
  s.prescriptions.forEach((p, i) => {
    if (tiene(p.note)) notas.push({ lugar: en(`prescriptions[${i}].note`), rotulo: `Nota de la prescripción ${i + 1} de «${s.label}»${contexto}`, texto: p.note });
    p.sets.forEach((x, j) => {
      if (tiene(x.note)) notas.push({ lugar: en(`prescriptions[${i}].sets[${j}].note`), rotulo: `Nota de la serie ${j + 1}, prescripción ${i + 1} de «${s.label}»${contexto}`, texto: x.note });
    });
  });
  return notas;
}

/** Todas las notas de texto libre de la estructura, en orden de lectura. */
export function notasDeLaEstructura(e: Estructura): NotaDeLaEstructura[] {
  const notas: NotaDeLaEstructura[] = [];
  e.blocks.forEach((b, i) => {
    const lb = `blocks[${i}]`;
    if (tiene(b.purpose)) notas.push({ lugar: `${lb}.purpose`, rotulo: `Propósito de la fase «${nombreDeLaFase(b.label, i)}»`, texto: b.purpose });
    (b.microcycles ?? []).forEach((m, j) => {
      const lm = `${lb}.microcycles[${j}]`;
      if (tiene(m.purpose)) notas.push({ lugar: `${lm}.purpose`, rotulo: `Propósito del microciclo «${m.label}» (fase «${nombreDeLaFase(b.label, i)}»)`, texto: m.purpose });
      m.sessions.forEach((s, k) => notas.push(...notasDeSesion(s, `${lm}.sessions[${k}]`, ` (microciclo «${m.label}»)`)));
    });
    (b.sessions ?? []).forEach((s, k) => notas.push(...notasDeSesion(s, `${lb}.sessions[${k}]`, ` (fase «${nombreDeLaFase(b.label, i)}»)`)));
  });
  return notas;
}

/**
 * La misma estructura con esa nota vacía (`null` para propósitos, instrucciones y notas de prescripción o de ítem; la
 * serie, sin nota). Sirve para entrenamiento y para nutrición: el lugar es un camino en la estructura.
 */
export function vaciarNota<T extends object>(e: T, lugar: string): T {
  const copia = JSON.parse(JSON.stringify(e)) as T;
  const partes = lugar.match(/[a-zA-Z]+|\d+/g) ?? [];
  let nodo: unknown = copia;
  for (let i = 0; i < partes.length - 1; i += 1) {
    const clave = partes[i]!;
    nodo = /^\d+$/.test(clave) ? (nodo as unknown[])[Number(clave)] : (nodo as Record<string, unknown>)[clave];
    if (nodo === undefined || nodo === null) return e;
  }
  const ultima = partes[partes.length - 1];
  if (!ultima || typeof nodo !== 'object' || nodo === null || !(ultima in (nodo as Record<string, unknown>))) return e;
  if (ultima === 'note' && lugar.includes('.sets[')) delete (nodo as Record<string, unknown>)[ultima];
  else (nodo as Record<string, unknown>)[ultima] = null;
  return copia;
}

// ─── Nutrición ────────────────────────────────────────────────────────────────────────────
import type { EstructuraDePlanEntrada, VersionDePlan } from './contratos-nutricion';

/** Las notas de texto libre de una estructura de comidas (la nota de cada ítem), en orden de lectura. */
export function notasDeLaEstructuraNutricional(e: EstructuraDePlanEntrada): NotaDeLaEstructura[] {
  const notas: NotaDeLaEstructura[] = [];
  e.dayTypes.forEach((d, i) =>
    d.meals.forEach((m, j) =>
      m.options.forEach((o, k) =>
        o.items.forEach((it, l) => {
          if (tiene(it.note)) notas.push({ lugar: `dayTypes[${i}].meals[${j}].options[${k}].items[${l}].note`, rotulo: `Nota del ítem ${l + 1} de «${o.label}» (${m.label}, ${d.label})`, texto: it.note });
        }),
      ),
    ),
  );
  return notas;
}

/** La jerarquía de una versión de plan de comidas como entrada (con identificadores; sin `order`, nombres ni versión de catálogo). */
export function estructuraNutricionalComoEntrada(v: VersionDePlan): EstructuraDePlanEntrada {
  return {
    dayTypes: v.dayTypes.map((d) => ({
      dayTypeId: d.dayTypeId,
      label: d.label,
      meals: d.meals.map((m) => ({
        mealId: m.mealId,
        label: m.label,
        prescriptionMode: m.prescriptionMode,
        options: m.options.map((o) => ({
          optionId: o.optionId,
          label: o.label,
          // NUA-08 (DL-180, segundo tramo): la medida casera elegida viaja con su cantidad.
          items: o.items.map((i) => ({ itemId: i.itemId, catalogItemId: i.catalogItemId, quantity: i.quantity, preparationState: i.preparationState, note: i.note, ...(i.householdMeasure ? { householdMeasure: i.householdMeasure } : {}) })),
        })),
      })),
    })),
  };
}

// ─── DL-108 D-3, ratificado el 19/11 · los nombres, los parámetros y la referencia del %RM ─────────────────────────

/**
 * Además de las notas, al guardar una plantilla viajan **textos que el profesional escribió y que pueden nombrar a la
 * persona**: los nombres de fases, microciclos, sesiones y bloques de la sesión («Diego · piernas»), los parámetros del
 * profesional de cada ejercicio y la referencia del %RM. Se muestran para confirmarlos o vaciarlos uno por uno, como las
 * notas (Dirección, 19/11). En Nutrición, los nombres de días tipo, comidas y opciones.
 *
 * - Un nombre no puede quedar vacío (el contrato lo pide): **vaciarlo es cambiarlo por el genérico** de su lugar («Fase
 *   2», «Sesión 1», «Bloque 1»). Los nombres que ya son genéricos no se listan: no dicen nada de nadie.
 * - Un parámetro se quita entero (su rótulo, su valor y su unidad); la referencia del %RM queda sin referencia.
 */
export interface LoQueViajaALaPlantilla {
  readonly tipo: 'NOMBRE' | 'PARAMETRO' | 'REFERENCIA';
  /** El camino en la estructura: `blocks[0].label`, `…prescriptions[1].professionalParameters[0]`, `…intensity.target.reference`. */
  readonly lugar: string;
  /** Qué es, en palabras. */
  readonly rotulo: string;
  readonly texto: string;
  /** Para un nombre: el genérico que queda al vaciarlo. */
  readonly generico: string | null;
}

/**
 * **Los nombres comunes, que no nombran a nadie y no se listan** (Dirección, 19/11). Se comparan sin tildes, sin
 * mayúsculas y con los guiones como espacios; cada uno puede llevar detrás un número o una letra («Piernas A», «Colación
 * 2», «Pre-entreno»).
 * - **Los de su lugar:** fase, bloque, microciclo, semana, sesión, día tipo, día, comida y opción.
 * - **Nutrición:** las comidas del día (desayuno, media mañana, almuerzo, merienda, media tarde, cena, colación, pre
 *   entreno, post entreno) y los días tipo que propone BE (día habitual, día de entrenamiento, día de descanso).
 * - **Entrenamiento:** el nombre de un grupo muscular o de una parte del cuerpo solo (pierna, torso, core, tren
 *   superior…) y lo que dice qué se trabaja (principal, complementarios, calentamiento, fuerza…).
 * Cualquier otro nombre se lista, aunque no nombre a nadie: decide el profesional.
 */
const NOMBRES_COMUNES: ReadonlySet<string> = new Set([
  // De su lugar.
  'fase', 'bloque', 'microciclo', 'semana', 'sesion', 'dia tipo', 'dia', 'comida', 'opcion',
  // Nutrición: las comidas del día y los días tipo de BE.
  'desayuno', 'media manana', 'almuerzo', 'merienda', 'media tarde', 'cena', 'colacion', 'pre entreno', 'preentreno', 'post entreno', 'postentreno',
  'dia habitual', 'dia de entrenamiento', 'dia de descanso',
  // Entrenamiento: un grupo muscular o una parte del cuerpo, solos, y lo que se trabaja.
  'pierna', 'piernas', 'torso', 'core', 'tren superior', 'tren inferior', 'cuerpo completo', 'full body', 'empuje', 'traccion',
  'pecho', 'espalda', 'hombro', 'hombros', 'brazo', 'brazos', 'gluteo', 'gluteos', 'abdomen', 'abdominales', 'cadera', 'gemelos',
  'cuadriceps', 'isquiotibiales', 'biceps', 'triceps',
  'principal', 'complementarios', 'accesorios', 'calentamiento', 'vuelta a la calma', 'movilidad', 'fuerza', 'hipertrofia', 'potencia', 'resistencia',
]);

const normalizarNombre = (nombre: string): string =>
  nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[-_·.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Un nombre que no dice nada de nadie: uno común, solo o con un número o una letra detrás. */
export function esNombreGenerico(nombre: string): boolean {
  const n = normalizarNombre(nombre);
  return NOMBRES_COMUNES.has(n) || NOMBRES_COMUNES.has(n.replace(/ ([0-9]{1,2}|[a-z])$/, ''));
}

/**
 * El genérico que queda al vaciar un nombre, **sin repetir el de un hermano** (revisión adversaria del 19/11): en una
 * fase con «Sesión B» y «Diego · piernas» (la A se borró), vaciar la segunda no deja dos «Sesión B». Se prueba primero el
 * de su lugar; si un hermano ya lo usa (comparado como los nombres comunes), el siguiente libre de la misma serie.
 */
function genericoLibre(lugar: number, serie: (n: number) => string, hermanos: readonly string[]): string {
  const ocupados = new Set(hermanos.filter((_, n) => n !== lugar).map(normalizarNombre));
  if (!ocupados.has(normalizarNombre(serie(lugar)))) return serie(lugar);
  for (let n = 0; n < hermanos.length + 1; n += 1) if (!ocupados.has(normalizarNombre(serie(n)))) return serie(n);
  return serie(lugar);
}

const nombre = (lugar: string, rotulo: string, texto: string, generico: string): LoQueViajaALaPlantilla[] =>
  esNombreGenerico(texto) || texto.trim() === '' ? [] : [{ tipo: 'NOMBRE', lugar, rotulo, texto: texto.trim(), generico }];

const valorDelParametro = (q: { readonly value: string | number; readonly unit?: string | null }): string => `${q.value}${q.unit ? ` ${q.unit}` : ''}`;

/** El nombre que el editor les da a las sesiones nuevas: «Sesión A», «Sesión B»… */
const sesionGenerica = (k: number): string => (k < 26 ? `Sesión ${String.fromCharCode(65 + k)}` : `Sesión ${k + 1}`);

function deLaSesion(s: Sesion, lugar: string, k: number, contexto: string, hermanas: readonly Sesion[]): LoQueViajaALaPlantilla[] {
  const items: LoQueViajaALaPlantilla[] = [...nombre(`${lugar}.label`, `Nombre de la sesión ${k + 1}${contexto}`, s.label, genericoLibre(k, sesionGenerica, hermanas.map((x) => x.label)))];
  const sesion = s.label.trim() || sesionGenerica(k);
  const grupos = s.exerciseGroups ?? [];
  grupos.forEach((g, j) =>
    items.push(...nombre(`${lugar}.exerciseGroups[${j}].label`, `Nombre del bloque ${j + 1} de «${sesion}»`, g.label, genericoLibre(j, (n) => `Bloque ${n + 1}`, grupos.map((x) => x.label)))),
  );
  s.prescriptions.forEach((p, i) => {
    (p.professionalParameters ?? []).forEach((q, j) =>
      items.push({ tipo: 'PARAMETRO', lugar: `${lugar}.prescriptions[${i}].professionalParameters[${j}]`, rotulo: `Parámetro «${q.label}» del ejercicio ${i + 1} de «${sesion}»`, texto: valorDelParametro(q), generico: null }),
    );
    const referencia = p.intensity?.target.reference?.description;
    if (tiene(referencia)) items.push({ tipo: 'REFERENCIA', lugar: `${lugar}.prescriptions[${i}].intensity.target.reference`, rotulo: `Referencia del %RM del ejercicio ${i + 1} de «${sesion}»`, texto: referencia, generico: null });
  });
  return items;
}

/** Los nombres, los parámetros del profesional y las referencias del %RM de una estructura de Entrenamiento, en orden de lectura. */
export function loQueViajaALaPlantilla(e: Estructura): LoQueViajaALaPlantilla[] {
  const items: LoQueViajaALaPlantilla[] = [];
  e.blocks.forEach((b, i) => {
    const lb = `blocks[${i}]`;
    // Las fases se comparan como se leen: «Bloque 2» de un plan viejo ocupa «Fase 2» (ENP-D01).
    items.push(...nombre(`${lb}.label`, `Nombre de la fase ${i + 1}`, b.label, genericoLibre(i, (n) => `Fase ${n + 1}`, e.blocks.map((x, n) => nombreDeLaFase(x.label, n)))));
    const fase = nombreDeLaFase(b.label, i);
    const microciclos = b.microcycles ?? [];
    microciclos.forEach((m, j) => {
      const lm = `${lb}.microcycles[${j}]`;
      items.push(...nombre(`${lm}.label`, `Nombre del microciclo ${j + 1} (fase «${fase}»)`, m.label, genericoLibre(j, (n) => `Semana ${n + 1}`, microciclos.map((x) => x.label))));
      m.sessions.forEach((s, k) => items.push(...deLaSesion(s, `${lm}.sessions[${k}]`, k, ` (microciclo «${m.label.trim() || `Semana ${j + 1}`}»)`, m.sessions)));
    });
    (b.sessions ?? []).forEach((s, k, todas) => items.push(...deLaSesion(s, `${lb}.sessions[${k}]`, k, ` (fase «${fase}»)`, todas)));
  });
  return items;
}

/** Los nombres de días tipo, comidas y opciones de una estructura de comidas, en orden de lectura. */
export function loQueViajaALaPlantillaNutricional(e: EstructuraDePlanEntrada): LoQueViajaALaPlantilla[] {
  const items: LoQueViajaALaPlantilla[] = [];
  e.dayTypes.forEach((d, i) => {
    items.push(...nombre(`dayTypes[${i}].label`, `Nombre del día tipo ${i + 1}`, d.label, genericoLibre(i, (n) => `Día tipo ${n + 1}`, e.dayTypes.map((x) => x.label))));
    const dia = d.label.trim() || `Día tipo ${i + 1}`;
    d.meals.forEach((m, j) => {
      items.push(...nombre(`dayTypes[${i}].meals[${j}].label`, `Nombre de la comida ${j + 1} (${dia})`, m.label, genericoLibre(j, (n) => `Comida ${n + 1}`, d.meals.map((x) => x.label))));
      const comida = m.label.trim() || `Comida ${j + 1}`;
      m.options.forEach((o, k) =>
        items.push(...nombre(`dayTypes[${i}].meals[${j}].options[${k}].label`, `Nombre de la opción ${k + 1} de «${comida}» (${dia})`, o.label, genericoLibre(k, (n) => `Opción ${n + 1}`, m.options.map((x) => x.label)))),
      );
    });
  });
  return items;
}

/**
 * La misma estructura con eso vaciado: el nombre, cambiado por su genérico; el parámetro, quitado; la referencia del
 * %RM, sin referencia. No muta la entrada; un lugar que no existe no cambia nada.
 */
export function vaciarLoQueViaja<T extends object>(e: T, x: LoQueViajaALaPlantilla): T {
  const copia = JSON.parse(JSON.stringify(e)) as T;
  const partes = x.lugar.match(/[a-zA-Z]+|\d+/g) ?? [];
  let nodo: unknown = copia;
  for (let i = 0; i < partes.length - 1; i += 1) {
    const clave = partes[i]!;
    nodo = /^\d+$/.test(clave) ? (nodo as unknown[])[Number(clave)] : (nodo as Record<string, unknown>)[clave];
    if (nodo === undefined || nodo === null) return e;
  }
  const ultima = partes[partes.length - 1];
  if (ultima === undefined || typeof nodo !== 'object' || nodo === null) return e;
  if (x.tipo === 'PARAMETRO') {
    if (!Array.isArray(nodo) || !/^\d+$/.test(ultima) || Number(ultima) >= nodo.length) return e;
    nodo.splice(Number(ultima), 1);
    return copia;
  }
  if (!(ultima in (nodo as Record<string, unknown>))) return e;
  (nodo as Record<string, unknown>)[ultima] = x.tipo === 'NOMBRE' ? x.generico : null;
  return copia;
}
