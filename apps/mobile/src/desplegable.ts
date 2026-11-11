/**
 * La regla de los desplegables de la APK (PV-4, decisión de Dirección del 2026-11-07; GUIA-UX-UI III.7; DL-166), como
 * lógica pura, sin React: la usan la pieza común de `ui.tsx` (`Desplegable`) y la prueba `scripts/vuelta-de-rosca.test.mjs`.
 *
 * - **Se pliega lo que explica:** el para qué, qué incluye, el detalle, la preparación, las cantidades en detalle y cómo
 *   funciona algo.
 * - **Nunca se pliega lo que hace falta para decidir:** el estado, la fecha, quién y si se puede responder
 *   (`LO_QUE_NUNCA_SE_PLIEGA`). Cada vista del paquete declara qué deja a la vista y qué pliega (`VistaConPliegue`), y la
 *   prueba revisa que ninguna pliegue lo que no se pliega.
 * - **TalkBack lo anuncia como botón con su estado** («contraído» o «expandido»): `accesibilidadDelDesplegable` es la
 *   única fuente de ese estado en la APK. Ningún otro archivo declara `expanded` por su cuenta.
 * - **Abrir no escribe nada:** la pieza solo guarda si está abierta, en la pantalla. No recibe el cliente de la API ni el
 *   almacén del teléfono.
 */

/** Las clases de dato que una vista puede mostrar, para decidir si se pueden plegar. */
export type ClaseDeDato =
  // Lo que hace falta para decidir: nunca se pliega.
  | 'estado'
  | 'fecha'
  | 'quien'
  | 'si-se-puede-responder'
  // Lo que explica: se puede plegar.
  | 'para-que'
  | 'que-incluye'
  | 'detalle'
  | 'preparacion'
  | 'cantidades'
  | 'como-funciona';

/** Lo que nunca va en un desplegable (III.7). */
export const LO_QUE_NUNCA_SE_PLIEGA: readonly ClaseDeDato[] = ['estado', 'fecha', 'quien', 'si-se-puede-responder'];

export const sePuedePlegar = (clase: ClaseDeDato): boolean => !LO_QUE_NUNCA_SE_PLIEGA.includes(clase);

/** Qué deja a la vista una pieza de pantalla y qué pliega. */
export interface VistaConPliegue {
  readonly nombre: string;
  readonly visible: readonly ClaseDeDato[];
  readonly plegado: readonly ClaseDeDato[];
}

/** Lo que una vista pliega y no debería: vacío si cumple la regla. */
export function problemasDelPliegue(vista: VistaConPliegue): ClaseDeDato[] {
  return vista.plegado.filter((c) => !sePuedePlegar(c));
}

/**
 * Las propiedades de accesibilidad de la cabeza de un desplegable: un botón con su estado, y un nombre que dice qué guarda
 * («6 ejercicios · 18 series»), no «Más información». `seleccionado` es para una fila que además se elige (un gráfico chico
 * que se abre al tocarlo).
 */
export function accesibilidadDelDesplegable(
  abierto: boolean,
  nombre: string,
  seleccionado?: boolean,
): { readonly accessibilityRole: 'button'; readonly accessibilityState: { readonly expanded: boolean; readonly selected?: boolean }; readonly accessibilityLabel: string } {
  return {
    accessibilityRole: 'button',
    accessibilityState: seleccionado === undefined ? { expanded: abierto } : { expanded: abierto, selected: seleccionado },
    accessibilityLabel: nombre,
  };
}
