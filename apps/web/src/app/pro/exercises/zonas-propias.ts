/**
 * Las zonas de un ejercicio propio, desde «Mis ejercicios» (WP-TABLERO-ALTA-GAMA TB-48; propuesta §23.2). La API las
 * admite desde WP-CATALOGO-VISUAL (API-EJE-04, DL-081), pero ninguna pantalla las dejaba cargar: un ejercicio cargado a
 * mano quedaba sin zonas, y la figura de la sesión decía «todavía no tiene zonas cargadas» sin ofrecer cómo.
 * - **Las 17 zonas del catálogo, en su orden** (de la cabeza a los pies, `ZONAS_MUSCULARES`): ni una más, ni otro nombre.
 *   Cada una, «No la nombra», «Principal» o «Secundaria», sin porcentajes (REG-06-139). Nada se dibuja nuevo: la vista
 *   previa es la misma figura de siempre, con las máscaras de Dirección.
 * - **Las declara el profesional,** para la versión vigente de su ejercicio, con el número de la última asignación que
 *   vio (`expectedZonesVersion`): si cambió en otra pestaña, la API lo rechaza y se dice.
 * Vive en el website hasta TB-20 (§8.2 del paquete). Sin React, para las pruebas.
 */
import { ZONAS_MUSCULARES, type CambiarZonasDeEjercicioRequest } from '@be/domain';

export type RolDeZona = 'PRIMARY' | 'SECONDARY';
/** Lo elegido para cada zona del catálogo: su rol, o nada si el ejercicio no la nombra. */
export type EleccionDeZonas = Readonly<Record<string, RolDeZona | ''>>;

/** Lo que el ejercicio tiene hoy, como elección: las zonas que no nombra, vacías. */
export function eleccionDe(zonas: readonly { readonly zoneId: string; readonly role: RolDeZona }[]): EleccionDeZonas {
  const roles = new Map(zonas.map((z) => [z.zoneId, z.role]));
  return Object.fromEntries(ZONAS_MUSCULARES.map((z) => [z.zoneId, roles.get(z.zoneId) ?? '']));
}

/** Las zonas elegidas, en el orden del catálogo: lo que dibuja la vista previa y lo que viaja a la API. */
export function zonasElegidas(eleccion: EleccionDeZonas): { zoneId: string; role: RolDeZona }[] {
  return ZONAS_MUSCULARES.flatMap((z) => {
    const rol = eleccion[z.zoneId];
    return rol ? [{ zoneId: z.zoneId, role: rol }] : [];
  });
}

/** Si lo elegido es distinto de lo que tiene: sin cambios no hay nada que guardar. */
export const cambiaronLasZonas = (antes: EleccionDeZonas, ahora: EleccionDeZonas): boolean => ZONAS_MUSCULARES.some((z) => (antes[z.zoneId] ?? '') !== (ahora[z.zoneId] ?? ''));

/** El pedido de API-EJE-04: la lista completa (vacía quita todas), para la versión vigente y con la asignación que se vio. */
export function pedidoDeZonas(eleccion: EleccionDeZonas, ficha: { readonly versionId: string; readonly zonesVersion: number }): CambiarZonasDeEjercicioRequest {
  return { exerciseVersionId: ficha.versionId, expectedZonesVersion: ficha.zonesVersion, muscleZones: zonasElegidas(eleccion) };
}

/** Los textos de las zonas de un ejercicio propio. «Principal» y «Secundaria» son los de la figura (`COPY_FIGURA_DE_ZONAS`). */
export const COPY_ZONAS_PROPIAS = {
  cargar: 'Cargar las zonas',
  cambiar: 'Cambiar las zonas',
  titulo: (nombre: string): string => `Las zonas de ${nombre}`,
  queEs: 'Elegí qué zonas nombra el ejercicio y si cada una es principal o secundaria. Es lo que muestra la figura, acá y en la sesión del plan: qué zonas nombra, no cuánto.',
  noLaNombra: 'No la nombra',
  asiSeVe: 'Así se ve',
  ningunaElegida: 'Todavía no elegiste ninguna zona.',
  guardar: 'Guardar las zonas',
  guardando: 'Guardando…',
  sinCambios: 'No cambiaste nada todavía.',
  cancelar: 'Cancelar',
  guardadas: (nombre: string): string => `Se guardaron las zonas de ${nombre}.`,
  conflicto: 'Las zonas de este ejercicio cambiaron en otra pestaña. Cancelá y volvé a abrirlas para ver las de ahora.',
} as const;
