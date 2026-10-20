/**
 * «Mis habituales» del profesional (PF-09 bis; DL-109), la lógica que comparten el website, la API y las pruebas:
 * - **las notas de texto libre** de una sesión o de una comida, con su lugar **relativo al nodo** (`instructions`,
 *   `prescriptions[0].sets[1].note`, `options[0].items[2].note`), para confirmarlas o vaciarlas una por una antes de
 *   guardar (DL-108 D-3), con la misma `vaciarNota` de las plantillas;
 * - **sin identificadores de nodo**: un habitual se inserta en cualquier borrador, incluso dos veces; el servidor asigna
 *   los identificadores al guardar el borrador;
 * - **sin cargas** ni **cantidades** salvo pedido (DL-108 D-2): son de cada persona, no del bloque.
 */
import type { z } from 'zod';
import type { SesionEntrada } from './contratos-entrenamiento';
import type { ComidaEntradaSchema } from './contratos-nutricion';
import { nombreNormalizadoDePlantilla } from './contratos-plantillas';
import { notasDeSesion, type NotaDeLaEstructura } from './plantillas-de-plan';

export type ComidaEntrada = z.infer<typeof ComidaEntradaSchema>;

const tiene = (t: string | null | undefined): t is string => typeof t === 'string' && t.trim().length > 0;

/** Las notas de texto libre de una sesión (instrucciones, nota de cada prescripción y de cada serie), con lugar relativo a la sesión. */
export const notasDeLaSesion = (s: SesionEntrada): NotaDeLaEstructura[] => notasDeSesion(s, '', '');

/** Las notas de texto libre de una comida (la nota de cada ítem de cada opción), con lugar relativo a la comida. */
export function notasDeLaComida(m: ComidaEntrada): NotaDeLaEstructura[] {
  const notas: NotaDeLaEstructura[] = [];
  m.options.forEach((o, k) =>
    o.items.forEach((it, l) => {
      if (tiene(it.note)) notas.push({ lugar: `options[${k}].items[${l}].note`, rotulo: `Nota del ítem ${l + 1} de «${o.label}» (${m.label})`, texto: it.note });
    }),
  );
  return notas;
}

/** La sesión sin `sessionId` ni `prescriptionId`: lista para insertarse en cualquier borrador (el servidor asigna los que faltan). */
export function sinIdentificadoresDeSesion(s: SesionEntrada): SesionEntrada {
  const { sessionId: _sesion, ...resto } = s;
  return { ...resto, prescriptions: s.prescriptions.map(({ prescriptionId: _prescripcion, ...p }) => p) };
}

/** La comida sin `mealId`, `optionId` ni `itemId`. */
export function sinIdentificadoresDeComida(m: ComidaEntrada): ComidaEntrada {
  const { mealId: _comida, ...resto } = m;
  return {
    ...resto,
    options: m.options.map(({ optionId: _opcion, ...o }) => ({ ...o, items: o.items.map(({ itemId: _item, ...i }) => i) })),
  };
}

/** DL-108 D-2: la sesión sin las cargas sugeridas de cada prescripción ni, desde DL-122, de cada serie; todo lo demás queda igual. */
export const sinCargasDeLaSesion = (s: SesionEntrada): SesionEntrada => ({
  ...s,
  prescriptions: s.prescriptions.map(({ suggestedLoad: _omitida, ...p }) => ({ ...p, sets: p.sets.map(({ suggestedLoad: _deLaSerie, ...serie }) => serie) })),
});

/** DL-108 D-2 en nutrición: la comida con `quantity: null` en cada ítem; el elemento, la preparación y la nota quedan. */
export const sinCantidadesDeLaComida = (m: ComidaEntrada): ComidaEntrada => ({ ...m, options: m.options.map((o) => ({ ...o, items: o.items.map((i) => ({ ...i, quantity: null })) })) });

/** Cuenta los ítems de una comida, en todas sus opciones. */
export const itemsDeLaComida = (m: ComidaEntrada): number => m.options.reduce((n, o) => n + o.items.length, 0);

/** El mismo nombre normalizado que las plantillas: la unicidad por profesional ignora mayúsculas, acentos y espacios repetidos. */
export const nombreNormalizadoDeHabitual = nombreNormalizadoDePlantilla;

/**
 * Los habituales que coinciden con lo que se escribe en el buscador de «Agregar ítem» o «Agregar ejercicio» (bloque 5 del
 * encargo de consolidación, 2026-10-19): el mismo campo filtra los habituales mientras se escribe y busca en el catálogo
 * al enviar. Sin texto, todos. Compara sin acentos ni mayúsculas, palabra por palabra y en cualquier orden: «cocido
 * arroz» encuentra «Arroz blanco, cocido». Solo filtra lo que el profesional ya marcó: no busca ni ordena por relevancia.
 */
export function habitualesQueCoinciden<T extends { readonly name: string }>(habituales: readonly T[], texto: string): readonly T[] {
  const palabras = nombreNormalizadoDePlantilla(texto).split(' ').filter(Boolean);
  if (palabras.length === 0) return habituales;
  return habituales.filter((h) => {
    const nombre = nombreNormalizadoDePlantilla(h.name);
    return palabras.every((p) => nombre.includes(p));
  });
}
