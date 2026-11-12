/**
 * Las opciones de una comida en Nutrición Hoy: una sola navegación (DL-170, AV2-21, con AV2-D10). Es la lógica pura,
 * sin React ni React Native: `scripts/registro-de-comidas.test.mjs` la prueba sin teléfono. El nombre del archivo es el
 * del carrusel que reemplaza (WP-NUTRICION-RECETAS §9).
 *
 * - **Un solo control.** Arriba, «Opción 1 | Opción 2 | Opción 3» en Segmentos compactos, y debajo una sola opción a
 *   todo el ancho. Se van el desplazamiento con imán, el asomo de la siguiente, las flechas y los puntitos: eran tres
 *   formas de hacer lo mismo. Con más de tres opciones, los segmentos dicen solo el número, para que entren; el grupo
 *   se llama «Opciones de Almuerzo» y TalkBack lo dice.
 * - **Manual.** Elegir una opción no registra ni cambia el plan: registrar es «Comí esta opción».
 * - **Se anuncia «Opción n de m»** al cambiar, para TalkBack. Con una sola opción no hay control.
 * - **La posición se recuerda por la opción, no por el índice.** Si el plan cambia el orden o saca una opción, se vuelve a
 *   la misma opción si sigue, o a la primera.
 * - **La imagen se pide solo para la opción a la vista**: cada acceso queda registrado en la API.
 */
import { COPY_REGISTRO_DE_COMIDAS } from '@be/domain';

/** Hasta cuántas opciones el segmento dice «Opción n»; desde ahí, solo el número. */
export const OPCIONES_CON_NOMBRE_ENTERO = 3;

/** Un índice dentro de las opciones: lo que no es un número va a la primera, y lo que se pasa, al extremo. */
export function indiceValido(indice: number, total: number): number {
  if (total <= 0 || !Number.isFinite(indice)) return 0;
  return Math.min(Math.max(Math.round(indice), 0), total - 1);
}

/** Los segmentos de las opciones, por su identidad. Con una sola opción, ninguno: no hay nada que elegir. */
export function segmentosDeLasOpciones(opciones: readonly { readonly optionId: string }[]): readonly { readonly valor: string; readonly texto: string }[] {
  if (opciones.length <= 1) return [];
  const conNombre = opciones.length <= OPCIONES_CON_NOMBRE_ENTERO;
  return opciones.map((o, i) => ({ valor: o.optionId, texto: conNombre ? `Opción ${i + 1}` : String(i + 1) }));
}

/** «Opción 2 de 3», lo que se anuncia al cambiar; `null` con una sola opción. */
export function anuncioDeLaOpcion(indice: number, total: number): string | null {
  return total <= 1 ? null : COPY_REGISTRO_DE_COMIDAS.opcionDe(indiceValido(indice, total) + 1, total);
}

/** La posición de la opción recordada; si ya no está en el plan, la primera. */
export function indiceDeLaOpcion(opciones: readonly { readonly optionId: string }[], opcionRecordada: string | null | undefined): number {
  if (!opcionRecordada) return 0;
  const i = opciones.findIndex((o) => o.optionId === opcionRecordada);
  return i >= 0 ? i : 0;
}
