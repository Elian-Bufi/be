/**
 * ED-41 (WP-EDITORES-PROFESIONAL) · «Solicitudes enviadas» como sección del Espacio, con filtros por estado y por
 * persona, sin React.
 *
 * - **Los filtros se cruzan** (estado y persona): «Pendientes» de Camila son las pendientes que se le enviaron a Camila.
 * - **Cada estado dice cuántas tiene** con el filtro de persona puesto, así un chip nunca promete lo que no hay; un
 *   estado sin ninguna no se ofrece, salvo el elegido (para poder volver a «Todas» sin que el chip desaparezca bajo el
 *   foco).
 * - **La persona se elige de una lista**, no se escribe: con «Ocultar nombres», buscar por un nombre que no se ve no
 *   tendría sentido. Se identifica por su identidad, nunca por el nombre que se muestra.
 * - Lo que se ve conserva el orden en que llegó la lista (la más nueva primero, como la devuelve la API).
 */
import type { EstadoDeSolicitudDeVinculo } from './vinculo-en-palabras';

/** Lo mínimo de una solicitud que usan los filtros. */
export interface SolicitudParaFiltrar {
  readonly state: EstadoDeSolicitudDeVinculo;
  readonly advisee: { readonly identityId: string };
}

export type EstadoDelFiltro = 'TODAS' | EstadoDeSolicitudDeVinculo;

export interface FiltroDeSolicitudes {
  readonly estado: EstadoDelFiltro;
  /** La identidad de la persona, o `null` para todas. */
  readonly persona: string | null;
}

export const SIN_FILTRO: FiltroDeSolicitudes = { estado: 'TODAS', persona: null };

/** El orden de los chips: primero lo que espera, después lo que ya se resolvió. */
export const ORDEN_DE_LOS_ESTADOS: readonly EstadoDeSolicitudDeVinculo[] = ['PENDIENTE', 'ACEPTADA', 'RECHAZADA', 'CADUCADA', 'INVALIDADA'];

/** El rótulo corto de cada chip (el estado largo, con su explicación, va en la fila). */
export const ROTULO_DEL_ESTADO: Readonly<Record<EstadoDelFiltro, string>> = {
  TODAS: 'Todas',
  PENDIENTE: 'Pendientes',
  ACEPTADA: 'Aceptadas',
  RECHAZADA: 'Rechazadas',
  CADUCADA: 'Caducadas',
  INVALIDADA: 'Sin efecto',
};

export function filtrarSolicitudes<T extends SolicitudParaFiltrar>(solicitudes: readonly T[], filtro: FiltroDeSolicitudes): T[] {
  return solicitudes.filter((s) => (filtro.estado === 'TODAS' || s.state === filtro.estado) && (filtro.persona === null || s.advisee.identityId === filtro.persona));
}

export interface ChipDeEstado {
  readonly estado: EstadoDelFiltro;
  readonly rotulo: string;
  readonly cuantas: number;
}

/** Los chips de estado con su cuenta, dentro de la persona elegida. «Todas» va siempre; los demás, si tienen alguna. */
export function chipsDeEstado(solicitudes: readonly SolicitudParaFiltrar[], filtro: FiltroDeSolicitudes): ChipDeEstado[] {
  const deLaPersona = filtrarSolicitudes(solicitudes, { estado: 'TODAS', persona: filtro.persona });
  const chips: ChipDeEstado[] = [{ estado: 'TODAS', rotulo: ROTULO_DEL_ESTADO.TODAS, cuantas: deLaPersona.length }];
  for (const estado of ORDEN_DE_LOS_ESTADOS) {
    const cuantas = deLaPersona.filter((s) => s.state === estado).length;
    if (cuantas > 0 || filtro.estado === estado) chips.push({ estado, rotulo: ROTULO_DEL_ESTADO[estado], cuantas });
  }
  return chips;
}

/** Las personas a las que se les envió alguna, una vez cada una, en el orden en que aparecen, con el nombre que se ve. */
export function personasDeLasSolicitudes<T extends SolicitudParaFiltrar>(solicitudes: readonly T[], nombre: (s: T) => string): { id: string; nombre: string }[] {
  const vistas = new Map<string, string>();
  for (const s of solicitudes) if (!vistas.has(s.advisee.identityId)) vistas.set(s.advisee.identityId, nombre(s));
  return [...vistas].map(([id, n]) => ({ id, nombre: n }));
}

/** Una persona elegida que ya no está en la lista (se recargó) deja de filtrar, en vez de dejar la tabla vacía sin razón. */
export function filtroVigente(solicitudes: readonly SolicitudParaFiltrar[], filtro: FiltroDeSolicitudes): FiltroDeSolicitudes {
  if (filtro.persona !== null && !solicitudes.some((s) => s.advisee.identityId === filtro.persona)) return { ...filtro, persona: null };
  return filtro;
}

/** «Se ven 3 de 12.», o nada si no hay filtro. */
export function cuantasSeVen(vistas: number, total: number, filtro: FiltroDeSolicitudes): string | null {
  if (filtro.estado === 'TODAS' && filtro.persona === null) return null;
  return `Se ${vistas === 1 ? 've' : 'ven'} ${vistas} de ${total}.`;
}
