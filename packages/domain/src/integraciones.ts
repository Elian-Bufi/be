/**
 * Reglas puras de la importación controlada (WP-08; UC-I07). Sin base, sin red, sin reloj: la API las aplica antes de
 * tocar la base, y las pruebas del dominio las fijan.
 *
 * UC-I07 §14.5.6 (05:15749-15756): no existe importación ciega; el proveedor no es fuente única; un dato incompleto
 * puede rechazarse; una corrección no oculta la fuente original.
 */
import type { ValidationIssue } from './contratos';
import type { AlimentoCandidato, ComposicionCandidata, EjercicioCandidato } from './contratos-integraciones';

/** Retención técnica del candidato que el 09 deja «definida posteriormente» (09v12:104; WP-08 D-C). */
export const DIAS_DE_VIGENCIA_DEL_CANDIDATO = 7;

/** Presupuesto de tiempo de una consulta al proveedor, sin reintentos dentro de la request (WP-08 D-E). */
export const PRESUPUESTO_DEL_PROVEEDOR_MS = 5_000;

const NUTRIENTES = ['energyKcal', 'proteinG', 'carbohydrateG', 'fatG'] as const;

/**
 * Lo que le falta a un alimento revisado para incorporarse al catálogo, con la ruta de cada dato. Un nombre en blanco
 * o un nutriente `null` falta; un cero, no — un cero es un dato («0 g de grasa»), y lo decide quien revisa.
 */
export function faltantesDeAlimento(revisado: AlimentoCandidato): ValidationIssue[] {
  const faltantes: ValidationIssue[] = [];
  if (revisado.name === null || revisado.name.trim() === '') faltantes.push({ code: 'REQUIRED', path: 'reviewedContent.name' });
  for (const n of NUTRIENTES) if (revisado.composition[n] === null) faltantes.push({ code: 'REQUIRED', path: `reviewedContent.composition.${n}` });
  return faltantes;
}

/** Lo que le falta a un ejercicio revisado: el nombre, que es lo único que el catálogo de ejercicios guarda. */
export function faltantesDeEjercicio(revisado: { readonly name: string | null }): ValidationIssue[] {
  return revisado.name === null || revisado.name.trim() === '' ? [{ code: 'REQUIRED', path: 'reviewedContent.name' }] : [];
}

/**
 * Qué cambió el profesional respecto de lo que trajo el proveedor, por ruta. Queda en la procedencia del elemento
 * incorporado: el dato final no oculta el del proveedor (B10-05 §19: dato del proveedor · corregido · final).
 */
export function camposCorregidosDeAlimento(candidato: AlimentoCandidato, revisado: AlimentoCandidato): string[] {
  const cambios: string[] = [];
  if (normalizarTexto(candidato.name) !== normalizarTexto(revisado.name)) cambios.push('name');
  if (candidato.composition.referenceAmount !== revisado.composition.referenceAmount) cambios.push('composition.referenceAmount');
  for (const n of NUTRIENTES) if (candidato.composition[n] !== revisado.composition[n]) cambios.push(`composition.${n}`);
  return cambios;
}

export function camposCorregidosDeEjercicio(candidato: EjercicioCandidato, revisado: { readonly name: string | null }): string[] {
  return normalizarTexto(candidato.name) === normalizarTexto(revisado.name) ? [] : ['name'];
}

/** La composición completa, una vez verificado que no falta nada (`faltantesDeAlimento` vacío). */
export function composicionCompleta(c: ComposicionCandidata): { referenceAmount: '100g' | '100ml'; energyKcal: number; proteinG: number; carbohydrateG: number; fatG: number } {
  for (const n of NUTRIENTES) if (c[n] === null) throw new Error(`composición incompleta: ${n}`);
  return { referenceAmount: c.referenceAmount, energyKcal: c.energyKcal!, proteinG: c.proteinG!, carbohydrateG: c.carbohydrateG!, fatG: c.fatG! };
}

const normalizarTexto = (t: string | null): string => (t ?? '').trim().replace(/\s+/g, ' ');
