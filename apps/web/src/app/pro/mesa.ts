/**
 * La mesa del Espacio profesional (WP-TABLERO-ALTA-GAMA TB-06 y TB-11; DL-163 D-4), sin React:
 * - **Los dos carriles.** «Te toca a vos» son los pendientes que resuelve el profesional (revisiones, planes y tomas);
 *   «Esperan respuesta», lo que espera a la persona (los formularios, las solicitudes de vínculo y las invitaciones). Los
 *   carriles separan quién tiene la próxima jugada, no cómo se porta nadie.
 * - **Por persona.** Se agrupa por `identityId`, nunca por nombre. Las personas van por su pendiente más urgente según
 *   `compararPendientes` (DL-107), y los renglones de cada una, en ese orden. «Por pendiente» es exactamente la lista de
 *   DL-107: el orden en que llega de la API.
 * - **El encabezado.** El saludo, con la primera palabra del nombre propio que no sea un título, o a secas; y las tres
 *   cifras con su desglose, que dicen «al menos» si faltan páginas.
 * Los textos viven acá hasta TB-20 (§8.2 del paquete), y pasan la prueba de términos de la cartera.
 */
import { compararPendientes, fechaCivil, TIPOS_DE_LA_VISTA_DE_PENDIENTES, type PendienteDeCartera, type TipoDePendiente } from '@be/domain';

/** Lo que resuelve el profesional: las revisiones, los planes y las tomas (D-4). */
export const TIPOS_QUE_TE_TOCAN: readonly TipoDePendiente[] = [...TIPOS_DE_LA_VISTA_DE_PENDIENTES.REVISIONES, ...TIPOS_DE_LA_VISTA_DE_PENDIENTES.PLANES, ...TIPOS_DE_LA_VISTA_DE_PENDIENTES.EVALUACIONES];
/** Lo que espera a la persona, de la cartera: los formularios sin responder. Las solicitudes y las invitaciones, aparte. */
export const TIPOS_QUE_ESPERAN: readonly TipoDePendiente[] = TIPOS_DE_LA_VISTA_DE_PENDIENTES.FORMULARIOS;

/** Las vistas de «Te toca a vos»: las de DL-107 sin «Formularios», que pasó al otro carril. */
export const VISTAS_QUE_TE_TOCAN = ['TODO', 'REVISIONES', 'PLANES', 'EVALUACIONES'] as const;
export type VistaQueTeToca = (typeof VISTAS_QUE_TE_TOCAN)[number];

export type ModoDeLaMesa = 'persona' | 'pendiente';

export const COPY_MESA = {
  teToca: 'Te toca a vos',
  esperan: 'Esperan respuesta',
  personas: 'Personas',
  porPersona: 'Por persona',
  porPendiente: 'Por pendiente',
  comoVer: 'Cómo ver lo que te toca',
  vacioTeToca: 'Nada te toca con lo registrado.',
  vacioEsperan: 'Nada espera respuesta.',
  formularios: 'Formularios',
  solicitudes: 'Solicitudes',
  invitaciones: 'Invitaciones',
  solicitud: (area: string, enviada: string): string => `Solicitud de vínculo · ${area} · enviada el ${enviada}`,
  invitacion: (area: string, vence: string): string => `Invitación · ${area} · vence el ${vence}`,
  sinPersonaTodavia: 'Todavía sin persona',
  verLasSolicitudes: 'Ver las solicitudes',
  verLasInvitaciones: 'Ver las invitaciones',
  /** «12» o «al menos 12», si faltan páginas por leer. */
  cifra: (n: number, completa: boolean): string => (completa ? String(n) : `al menos ${n}`),
  pendientesDe: (n: number): string => (n === 1 ? 'un pendiente' : `${n} pendientes`),
} as const;

// ─── Por persona ─────────────────────────────────────────────────────────────────────────────

type Ordenable = Pick<PendienteDeCartera, 'kind' | 'since' | 'daysOverdue' | 'advisee'>;
const ordenable = (p: Ordenable) => ({ kind: p.kind, since: p.since, daysOverdue: p.daysOverdue, adviseeId: p.advisee.identityId });
/** El orden de DL-107 entre dos filas de la cartera. */
export const compararFilas = (a: Ordenable, b: Ordenable): number => compararPendientes(ordenable(a), ordenable(b));

export interface PersonaDeLaMesa<T extends Ordenable> {
  readonly identityId: string;
  readonly advisee: T['advisee'];
  /** Sus pendientes, en el orden de DL-107. El primero es el más urgente. */
  readonly pendientes: readonly T[];
}

/** Los pendientes agrupados por persona (por `identityId`), con las personas por su pendiente más urgente. */
export function porPersona<T extends Ordenable>(items: readonly T[]): PersonaDeLaMesa<T>[] {
  const grupos = new Map<string, T[]>();
  for (const p of items) {
    const grupo = grupos.get(p.advisee.identityId);
    if (grupo) grupo.push(p);
    else grupos.set(p.advisee.identityId, [p]);
  }
  // `sort` es estable: dos renglones empatados quedan en el orden en que llegaron (el de la API).
  const personas = [...grupos].map(([identityId, filas]) => {
    const pendientes = [...filas].sort(compararFilas);
    return { identityId, advisee: (pendientes[0] as T).advisee, pendientes };
  });
  return personas.sort((a, b) => compararFilas(a.pendientes[0] as T, b.pendientes[0] as T));
}

/** Los de un carril, en el orden en que llegaron: «Por pendiente» es exactamente la lista de DL-107. */
export const delCarril = <T extends Pick<PendienteDeCartera, 'kind'>>(items: readonly T[], tipos: readonly TipoDePendiente[]): T[] => items.filter((p) => tipos.includes(p.kind));

// ─── Esperan respuesta ───────────────────────────────────────────────────────────────────────

export interface FormularioQueEspera {
  readonly tipo: 'formulario';
  readonly pendiente: PendienteDeCartera;
}
export interface SolicitudQueEspera<S> {
  readonly tipo: 'solicitud';
  readonly solicitud: S;
}
export interface InvitacionQueEspera<I> {
  readonly tipo: 'invitacion';
  readonly invitacion: I;
}
export type LoQueEspera<S, I> = (FormularioQueEspera | SolicitudQueEspera<S> | InvitacionQueEspera<I>) & { readonly clave: string; readonly desde: string };

type Solicitud = { readonly relationshipRequestId: string; readonly createdAt: string; readonly state: string };
type Invitacion = { readonly invitationId: string; readonly createdAt: string; readonly state: string };
const ORDEN_DEL_TIPO = { formulario: 0, solicitud: 1, invitacion: 2 } as const;

/**
 * Lo que espera a la persona: los formularios sin responder (de la cartera), las solicitudes de vínculo sin responder que
 * mandó el profesional y sus invitaciones sin usar. Va por antigüedad (lo que espera hace más, primero), sin marcar a
 * nadie: el día en que se mandó es el de la zona de la cartera.
 */
export function loQueEspera<S extends Solicitud, I extends Invitacion>(
  formularios: readonly PendienteDeCartera[],
  solicitudes: readonly S[],
  invitaciones: readonly I[],
  zona: string,
): LoQueEspera<S, I>[] {
  const todo: LoQueEspera<S, I>[] = [
    ...formularios
      .filter((p) => TIPOS_QUE_ESPERAN.includes(p.kind))
      .map((p) => ({ tipo: 'formulario' as const, pendiente: p, clave: `formulario|${p.domain}|${p.advisee.identityId}`, desde: p.since ?? '9999-12-31' })),
    ...solicitudes.filter((s) => s.state === 'PENDIENTE').map((s) => ({ tipo: 'solicitud' as const, solicitud: s, clave: `solicitud|${s.relationshipRequestId}`, desde: fechaCivil(s.createdAt, zona) })),
    ...invitaciones.filter((i) => i.state === 'PENDING').map((i) => ({ tipo: 'invitacion' as const, invitacion: i, clave: `invitacion|${i.invitationId}`, desde: fechaCivil(i.createdAt, zona) })),
  ];
  return todo.sort((a, b) => a.desde.localeCompare(b.desde) || ORDEN_DEL_TIPO[a.tipo] - ORDEN_DEL_TIPO[b.tipo] || a.clave.localeCompare(b.clave));
}

// ─── El encabezado ───────────────────────────────────────────────────────────────────────────

/** Los títulos que no son un nombre: los que terminan en punto («Lic.», «Dra.») y estos, escritos sin él. */
const TITULOS = new Set(['lic', 'licenciada', 'licenciado', 'dr', 'dra', 'doctor', 'doctora', 'prof', 'profe', 'profesor', 'profesora', 'mg', 'mgtr', 'ing', 'nutricionista', 'entrenador', 'entrenadora']);

/** La primera palabra del nombre que no es un título y empieza con una letra, o `null`: el saludo va a secas. */
export function primerNombre(nombre: string | null | undefined): string | null {
  for (const palabra of (nombre ?? '').trim().split(/\s+/)) {
    if (!palabra || palabra.endsWith('.') || TITULOS.has(palabra.toLowerCase()) || !/^\p{L}/u.test(palabra)) continue;
    return palabra.replace(/[,;:]+$/, '');
  }
  return null;
}

/** «Buen día» de 5 a 12, «Buenas tardes» de 12 a 20 y «Buenas noches» el resto, con la hora del navegador. */
export function saludoDeLaHora(hora: number): string {
  if (hora >= 5 && hora < 12) return 'Buen día';
  if (hora >= 12 && hora < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

/** El saludo: con el primer nombre si lo hay y los nombres se ven; si no, a secas. */
export function saludo(hora: number, nombrePropio: string | null, nombresOcultos: boolean): string {
  const nombre = nombresOcultos ? null : primerNombre(nombrePropio);
  return nombre ? `${saludoDeLaHora(hora)}, ${nombre}` : saludoDeLaHora(hora);
}

/** Las áreas de las personas de «Tus asesorados», para el desglose de «Personas»: cuántas tienen acceso en cada una. */
export function personasPorArea(personas: readonly { readonly conAcceso: readonly string[] }[]): { readonly area: string; readonly personas: number }[] {
  const cuenta = new Map<string, number>();
  for (const p of personas) for (const a of p.conAcceso) cuenta.set(a, (cuenta.get(a) ?? 0) + 1);
  return [...cuenta].map(([area, n]) => ({ area, personas: n }));
}
