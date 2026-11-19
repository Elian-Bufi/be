/**
 * WP-NUTRICION-ALIMENTOS (DL-180) · la lógica de los alimentos del catálogo en el website del profesional, sin React:
 * - **NUA-02:** lo que ya está citado y se retiró se marca «retirado», discreto, y no se esconde;
 * - **NUA-03:** el nivel del origen en la fila del buscador («Verificado», «Tuyo», «De otro profesional»), y lo de otro
 *   profesional pide mirar sus valores antes de sumarlo;
 * - **NUA-04:** el verificado equivalente se sugiere justo antes del alimento que lo tiene;
 * - **NUA-05:** el ícono del grupo, en el buscador y en las opciones.
 * Las pantallas (`cuadro-de-la-opcion.tsx`, `comida-del-editor.tsx`, `/pro/foods`) solo dibujan lo que esto decide.
 */
import { COPY_ALIMENTOS, ETIQUETA_DEL_NIVEL, iconoDelAlimento, type GrupoDeAlimento, type NivelDeOrigen, type NombreDeIcono } from '@be/domain';
import { createContext, useContext } from 'react';

/** Lo que el editor sabe de un alimento citado, por su identidad: su grupo y si se retiró. */
export interface DatosDelAlimento {
  readonly grupo: GrupoDeAlimento | null;
  readonly retirado: boolean;
}
export const SIN_DATOS_DEL_ALIMENTO: DatosDelAlimento = { grupo: null, retirado: false };

/** De una fila del buscador o de la consulta por identidad (API-ALI-04): lo que falta vale lo de siempre (sin grupo, no retirado). */
export function datosDelAlimento(a: { readonly foodGroup?: GrupoDeAlimento | null | undefined; readonly retired?: boolean | undefined } | undefined | null): DatosDelAlimento {
  return a ? { grupo: a.foodGroup ?? null, retirado: a.retired === true } : SIN_DATOS_DEL_ALIMENTO;
}

/**
 * Los datos de los alimentos citados, para las filas que los muestran (`FilaDeItem`) sin pasarlos de mano en mano: el
 * editor los provee y el cuadro de la opción suma los que se agregan.
 */
export const ContextoDeLosAlimentos = createContext<ReadonlyMap<string, DatosDelAlimento>>(new Map());
export function useDatosDelAlimento(catalogItemId: string): DatosDelAlimento {
  return useContext(ContextoDeLosAlimentos).get(catalogItemId) ?? SIN_DATOS_DEL_ALIMENTO;
}

/** El ícono de la fila: el de su grupo, o el genérico. */
export function iconoDeLaFila(datos: Pick<DatosDelAlimento, 'grupo'>): NombreDeIcono {
  return iconoDelAlimento(datos.grupo);
}

// ─── El buscador ──────────────────────────────────────────────────────────────────────────────────

/** Lo que el buscador necesita de un alimento para el nivel, la sugerencia y el aviso (todo opcional: una API anterior no lo manda). */
export interface ConNivel {
  readonly catalogItemId: string;
  readonly name: string;
  readonly originLevel?: NivelDeOrigen | undefined;
  readonly verifiedEquivalent?: { readonly catalogItemId: string; readonly name: string } | null | undefined;
}

/** La etiqueta del nivel que va a la vista, o ninguna (lo importado y lo de demostración ya dicen su origen). */
export function etiquetaDelNivel(a: Pick<ConNivel, 'catalogItemId' | 'originLevel'>): string | null {
  return a.originLevel ? ETIQUETA_DEL_NIVEL[a.originLevel] : null;
}

/** NUA-03: lo de otro profesional, sin certificar, se mira antes de sumarlo. */
export function pideMirarAntesDeSumar(a: Pick<ConNivel, 'catalogItemId' | 'originLevel'>): boolean {
  return a.originLevel === 'OTHER_PROFESSIONAL';
}

/** Una fila del buscador: el alimento, si es habitual y, si es una sugerencia, de cuál es el equivalente verificado. */
export interface FilaSugerida<A> {
  readonly alimento: A;
  readonly habitual: boolean;
  /** NUA-04: el nombre del alimento del que es el equivalente verificado; `null` si no es una sugerencia. */
  readonly sugeridoPor: string | null;
}

/**
 * NUA-04: cada alimento que tiene un equivalente verificado lleva ese verificado justo antes, como sugerencia, salvo que
 * ya esté en la lista (entonces no se repite). Una sugerencia no se sugiere dos veces.
 */
export function conSugeridos<A extends ConNivel>(filas: readonly { readonly alimento: A; readonly habitual: boolean }[], comoAlimento: (equivalente: NonNullable<ConNivel['verifiedEquivalent']>) => A): FilaSugerida<A>[] {
  const presentes = new Set(filas.map((f) => f.alimento.catalogItemId));
  const resultado: FilaSugerida<A>[] = [];
  for (const f of filas) {
    const e = f.alimento.verifiedEquivalent;
    if (e && !presentes.has(e.catalogItemId)) {
      presentes.add(e.catalogItemId);
      resultado.push({ alimento: comoAlimento(e), habitual: false, sugeridoPor: f.alimento.name });
    }
    resultado.push({ ...f, sugeridoPor: null });
  }
  return resultado;
}

/** Lo que se dice en la fila de un alimento con equivalente verificado, si el verificado ya está en la lista. */
export function avisoDeEquivalente(a: ConNivel): string | null {
  return a.verifiedEquivalent ? COPY_ALIMENTOS.tieneEquivalente(a.verifiedEquivalent.name) : null;
}
