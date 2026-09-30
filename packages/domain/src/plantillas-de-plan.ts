/**
 * Plantillas del profesional (PF-09; DL-108), la lógica que comparten el website y las pruebas:
 * - **las notas de texto libre** de una estructura (propósito de bloque y microciclo, instrucciones de sesión, nota de
 *   prescripción y notas por serie), cada una con su lugar, para que el profesional las confirme o las vacíe **una por
 *   una** antes de guardar (D-3): una nota puede nombrar a la persona («cuidado con la rodilla de Juan»), y el molde no
 *   debe llevarla;
 * - **vaciar** una nota por su lugar, sin tocar nada más.
 */
import type { EstructuraDePlanDeEntrenamientoEntrada } from './contratos-entrenamiento';

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

function notasDeSesion(s: Sesion, lugar: string, contexto: string): NotaDeLaEstructura[] {
  const notas: NotaDeLaEstructura[] = [];
  if (tiene(s.instructions)) notas.push({ lugar: `${lugar}.instructions`, rotulo: `Instrucciones de la sesión «${s.label}»${contexto}`, texto: s.instructions });
  s.prescriptions.forEach((p, i) => {
    if (tiene(p.note)) notas.push({ lugar: `${lugar}.prescriptions[${i}].note`, rotulo: `Nota de la prescripción ${i + 1} de «${s.label}»${contexto}`, texto: p.note });
    p.sets.forEach((x, j) => {
      if (tiene(x.note)) notas.push({ lugar: `${lugar}.prescriptions[${i}].sets[${j}].note`, rotulo: `Nota de la serie ${j + 1}, prescripción ${i + 1} de «${s.label}»${contexto}`, texto: x.note });
    });
  });
  return notas;
}

/** Todas las notas de texto libre de la estructura, en orden de lectura. */
export function notasDeLaEstructura(e: Estructura): NotaDeLaEstructura[] {
  const notas: NotaDeLaEstructura[] = [];
  e.blocks.forEach((b, i) => {
    const lb = `blocks[${i}]`;
    if (tiene(b.purpose)) notas.push({ lugar: `${lb}.purpose`, rotulo: `Propósito del bloque «${b.label}»`, texto: b.purpose });
    (b.microcycles ?? []).forEach((m, j) => {
      const lm = `${lb}.microcycles[${j}]`;
      if (tiene(m.purpose)) notas.push({ lugar: `${lm}.purpose`, rotulo: `Propósito del microciclo «${m.label}» (bloque «${b.label}»)`, texto: m.purpose });
      m.sessions.forEach((s, k) => notas.push(...notasDeSesion(s, `${lm}.sessions[${k}]`, ` (microciclo «${m.label}»)`)));
    });
    (b.sessions ?? []).forEach((s, k) => notas.push(...notasDeSesion(s, `${lb}.sessions[${k}]`, ` (bloque «${b.label}»)`)));
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
          items: o.items.map((i) => ({ itemId: i.itemId, catalogItemId: i.catalogItemId, quantity: i.quantity, preparationState: i.preparationState, note: i.note })),
        })),
      })),
    })),
  };
}
