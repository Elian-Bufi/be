/**
 * RF-068 (04; DEUDA_LEGAJO DL-172; 05 UC-P28; 06 T-06-06; 09 v0.12 §16) · Las incidencias administrativas mínimas.
 *
 * «Registrar y gestionar incidencias operativas vinculadas con acceso, perfiles, vínculos, integridad de información o
 * funcionamiento de los recorridos, sin convertir el MVP en una plataforma general de soporte.» Lo mínimo:
 * - **La persona o el profesional la reporta** (API-INC-01) desde su cuenta, con una categoría y una descripción, y ve el
 *   estado de lo suyo y la respuesta de Administración (API-INC-02). Nada más: no es un chat ni una mesa de ayuda.
 * - **Administración la consulta y la gestiona** (API-INC-03 a 05): una lista con filtros por estado y categoría, el
 *   detalle con su historia, y el cambio de estado con un motivo. Resolverla lleva la respuesta para quien la reportó.
 * - **La historia no se sobrescribe** (09 v0.12 §16: «incident history append-only»): cada cambio es una fila nueva, con su
 *   motivo, su administrador y su momento; la incidencia guarda solo el estado vigente y quién la tiene a cargo.
 * - **Acceso restringido:** quien la reportó ve solo lo suyo (lo ajeno es el mismo 404 que lo inexistente), sin el motivo
 *   interno; Administración ve el correo de acceso de quien la reportó (para responder por el canal) y nada de salud.
 */
import { z } from 'zod';
import { IdOpaco, Instante } from './contratos';
import { PaginaSchema } from './contratos-vinculo';

/** 04 RF-068: acceso, perfiles, vínculos, integridad de la información y funcionamiento de los recorridos. */
export const CATEGORIAS_DE_INCIDENCIA = ['ACCESS', 'PROFILE', 'RELATIONSHIP', 'DATA_INTEGRITY', 'APP_FUNCTIONING'] as const;
export type CategoriaDeIncidencia = (typeof CATEGORIAS_DE_INCIDENCIA)[number];

/** Abierta (nadie la tomó), en curso (Administración la está viendo) y resuelta (con su respuesta). */
export const ESTADOS_DE_INCIDENCIA = ['OPEN', 'IN_PROGRESS', 'RESOLVED'] as const;
export type EstadoDeIncidencia = (typeof ESTADOS_DE_INCIDENCIA)[number];

export const LARGO_MAXIMO_DE_LA_DESCRIPCION_DE_INCIDENCIA = 2000;
export const LARGO_MAXIMO_DEL_MOTIVO_DE_INCIDENCIA = 1000;
export const LARGO_MAXIMO_DE_LA_RESPUESTA_DE_INCIDENCIA = 2000;

/** El `version` del contrato: cuántos cambios tuvo la incidencia («v0» al nacer). */
export const versionDeIncidencia = (n: number): string => `v${n}`;
/** El número de una versión del contrato, o `null` si no tiene esa forma. */
export function numeroDeVersionDeIncidencia(version: string): number | null {
  const m = /^v(0|[1-9]\d{0,6})$/.exec(version);
  return m ? Number(m[1]) : null;
}

/** Un texto escrito por alguien: sin espacios en los bordes y en forma NFC; `null` si quedó vacío. */
export function textoDeIncidencia(texto: string | undefined | null): string | null {
  const limpio = (texto ?? '').normalize('NFC').trim();
  return limpio ? limpio : null;
}

const largo = (t: string): number => [...t].length;

/** Los issues del 422 de API-INC-01: la descripción es obligatoria y tiene un tope. */
export function problemasDelReporte(descripcion: string | undefined | null): { code: string; path: string }[] {
  const d = textoDeIncidencia(descripcion);
  if (!d) return [{ code: 'DESCRIPTION_REQUIRED', path: 'description' }];
  if (largo(d) > LARGO_MAXIMO_DE_LA_DESCRIPCION_DE_INCIDENCIA) return [{ code: 'DESCRIPTION_TOO_LONG', path: 'description' }];
  return [];
}

/**
 * Lo que decide un cambio de estado (API-INC-05), con lo que hay en la base y lo que mandó Administración:
 * - la versión que vio tiene que ser la vigente (`VERSION`: alguien la cambió mientras tanto, 409);
 * - el estado nuevo tiene que ser otro (`MISMO_ESTADO`, 422 INVALID_STATE_TRANSITION). Se puede reabrir una resuelta: el
 *   problema puede volver, y la historia conserva la resolución anterior;
 * - el motivo es obligatorio, y resolverla pide la respuesta para quien la reportó (`issues`, 422 VALIDATION_FAILED).
 */
export type DecisionDeCambioDeIncidencia =
  | { readonly tipo: 'CAMBIAR'; readonly motivo: string; readonly respuesta: string | null }
  | { readonly tipo: 'VERSION' }
  | { readonly tipo: 'MISMO_ESTADO' }
  | { readonly tipo: 'INVALIDO'; readonly issues: readonly { code: string; path: string }[] };

export function decidirCambioDeIncidencia(p: {
  readonly estadoActual: EstadoDeIncidencia;
  readonly versionActual: number;
  readonly estadoNuevo: EstadoDeIncidencia;
  readonly versionEsperada: string;
  readonly motivo: string | undefined | null;
  readonly respuesta: string | undefined | null;
}): DecisionDeCambioDeIncidencia {
  const issues: { code: string; path: string }[] = [];
  const motivo = textoDeIncidencia(p.motivo);
  const respuesta = textoDeIncidencia(p.respuesta);
  if (!motivo) issues.push({ code: 'REASON_REQUIRED', path: 'reason' });
  else if (largo(motivo) > LARGO_MAXIMO_DEL_MOTIVO_DE_INCIDENCIA) issues.push({ code: 'REASON_TOO_LONG', path: 'reason' });
  if (respuesta && largo(respuesta) > LARGO_MAXIMO_DE_LA_RESPUESTA_DE_INCIDENCIA) issues.push({ code: 'RESPONSE_TOO_LONG', path: 'response' });
  else if (!respuesta && p.estadoNuevo === 'RESOLVED') issues.push({ code: 'RESPONSE_REQUIRED', path: 'response' });
  if (issues.length > 0) return { tipo: 'INVALIDO', issues };
  if (numeroDeVersionDeIncidencia(p.versionEsperada) !== p.versionActual) return { tipo: 'VERSION' };
  if (p.estadoNuevo === p.estadoActual) return { tipo: 'MISMO_ESTADO' };
  return { tipo: 'CAMBIAR', motivo: motivo as string, respuesta };
}

/**
 * Lo que ve quien la reportó de la respuesta de Administración: la del último cambio que trajo una. Si se reabrió después
 * de resolverla, la respuesta anterior sigue (es lo último que se le dijo), y el estado dice que se está viendo otra vez.
 */
export function ultimaRespuesta(cambios: readonly { readonly numero: number; readonly respuesta: string | null }[]): string | null {
  let ultima: { numero: number; respuesta: string } | null = null;
  for (const c of cambios) if (c.respuesta !== null && (!ultima || c.numero > ultima.numero)) ultima = { numero: c.numero, respuesta: c.respuesta };
  return ultima?.respuesta ?? null;
}

// ─── API-INC-01 y 02 · La persona o el profesional ───────────────────────────────────────────────

export const ReportarIncidenciaRequestSchema = z.strictObject({
  category: z.enum(CATEGORIAS_DE_INCIDENCIA),
  /** Qué pasó. De 1 a 2000 caracteres, sin contar los espacios de los bordes (422 con su issue). */
  description: z.string().max(4000),
});
export type ReportarIncidenciaRequest = z.infer<typeof ReportarIncidenciaRequestSchema>;

/** Una incidencia como la ve quien la reportó: el estado y la respuesta, sin el motivo interno ni quién la atendió. */
export const IncidenciaPropiaSchema = z.strictObject({
  incidentId: IdOpaco,
  category: z.enum(CATEGORIAS_DE_INCIDENCIA),
  description: z.string(),
  state: z.enum(ESTADOS_DE_INCIDENCIA),
  createdAt: Instante,
  updatedAt: Instante,
  /** La última respuesta de Administración, o `null` si todavía no le respondió. */
  response: z.string().nullable(),
});
export type IncidenciaPropia = z.infer<typeof IncidenciaPropiaSchema>;
export const IncidenciaPropiaResponseSchema = z.strictObject({ data: IncidenciaPropiaSchema });
export type IncidenciaPropiaResponse = z.infer<typeof IncidenciaPropiaResponseSchema>;
export const ListaDeIncidenciasPropiasResponseSchema = z.strictObject({ data: z.array(IncidenciaPropiaSchema), page: PaginaSchema });
export type ListaDeIncidenciasPropiasResponse = z.infer<typeof ListaDeIncidenciasPropiasResponseSchema>;

// ─── API-INC-03 a 05 · Administración ────────────────────────────────────────────────────────────

const PersonaDeLaIncidenciaSchema = z.strictObject({ identityId: IdOpaco, email: z.string().nullable() });
const AdministradorDeLaIncidenciaSchema = z.strictObject({ identityId: IdOpaco, name: z.string() });

/** Como la ve Administración: quién la reportó (su correo de acceso), su versión y quién la tiene a cargo. */
export const IncidenciaAdministrativaSchema = IncidenciaPropiaSchema.extend({
  reporter: PersonaDeLaIncidenciaSchema,
  version: z.string(),
  /** Quién registró el último cambio (la tiene a cargo, o la resolvió); `null` si nadie la tomó. */
  assignee: AdministradorDeLaIncidenciaSchema.nullable(),
});
export type IncidenciaAdministrativa = z.infer<typeof IncidenciaAdministrativaSchema>;

export const CambioDeIncidenciaSchema = z.strictObject({
  number: z.number().int().positive(),
  from: z.enum(ESTADOS_DE_INCIDENCIA),
  to: z.enum(ESTADOS_DE_INCIDENCIA),
  /** El motivo: lo ve solo Administración. */
  reason: z.string(),
  /** Lo que se le dijo a quien la reportó con este cambio, o `null`. */
  response: z.string().nullable(),
  administrator: AdministradorDeLaIncidenciaSchema,
  at: Instante,
});
export type CambioDeIncidenciaApi = z.infer<typeof CambioDeIncidenciaSchema>;

/** El detalle: la incidencia y toda su historia, del primer cambio al último. */
export const DetalleDeIncidenciaResponseSchema = z.strictObject({
  data: IncidenciaAdministrativaSchema.extend({ history: z.array(CambioDeIncidenciaSchema) }),
});
export type DetalleDeIncidenciaResponse = z.infer<typeof DetalleDeIncidenciaResponseSchema>;

export const ConsultarIncidenciasRequestSchema = z.strictObject({
  /** Los estados que se quieren ver (sin filtro: todos). «Pendientes» son OPEN e IN_PROGRESS. */
  states: z.array(z.enum(ESTADOS_DE_INCIDENCIA)).min(1).max(3).optional(),
  category: z.enum(CATEGORIAS_DE_INCIDENCIA).optional(),
  limit: z.number().int().min(1).max(50).optional(),
  cursor: z.string().max(400).optional(),
});
export type ConsultarIncidenciasRequest = z.infer<typeof ConsultarIncidenciasRequestSchema>;
export const ListaAdministrativaDeIncidenciasResponseSchema = z.strictObject({ data: z.array(IncidenciaAdministrativaSchema), page: PaginaSchema });
export type ListaAdministrativaDeIncidenciasResponse = z.infer<typeof ListaAdministrativaDeIncidenciasResponseSchema>;

export const CambiarEstadoDeIncidenciaRequestSchema = z.strictObject({
  state: z.enum(ESTADOS_DE_INCIDENCIA),
  /** El motivo del cambio (de 1 a 1000 caracteres): lo ve solo Administración. */
  reason: z.string().max(2000),
  /** Lo que se le dice a quien la reportó (hasta 2000 caracteres). Obligatoria al resolverla. */
  response: z.string().max(4000).optional(),
  /** La versión que vio Administración («v0», «v1»…): si cambió, 409 VERSION_CONFLICT. */
  expectedVersion: z.string().max(20),
});
export type CambiarEstadoDeIncidenciaRequest = z.infer<typeof CambiarEstadoDeIncidenciaRequestSchema>;

/** Los pendientes primero, del más viejo al más nuevo (el orden en que se atienden); las resueltas, de la más nueva a la más vieja. */
export const ORDEN_DE_LOS_ESTADOS_DE_INCIDENCIA: Readonly<Record<EstadoDeIncidencia, number>> = { OPEN: 0, IN_PROGRESS: 1, RESOLVED: 2 };

// ─── Los textos (website) ─────────────────────────────────────────────────────────────────────────

export const COPY_INCIDENCIAS = {
  titulo: 'Avisar un problema',
  queEs: 'Si algo de BE no funciona como debería, contanos qué pasó. Lo ve Administración y te responde acá.',
  categoria: 'De qué se trata',
  categorias: {
    ACCESS: 'Entrar a mi cuenta',
    PROFILE: 'Mi perfil o mis datos de cuenta',
    RELATIONSHIP: 'Un vínculo con un profesional',
    DATA_INTEGRITY: 'Un dato que no coincide o que falta',
    APP_FUNCTIONING: 'Algo de la app o del website que no funciona',
  } as Readonly<Record<CategoriaDeIncidencia, string>>,
  descripcion: 'Qué pasó',
  descripcionAyuda: 'Qué hacías, qué esperabas y qué pasó. No escribas datos de salud ni contraseñas. Hasta 2000 caracteres.',
  enviar: 'Enviar el aviso',
  enviando: 'Enviando…',
  enviado: 'Recibimos tu aviso. Vas a ver la respuesta acá.',
  descripcionRequerida: 'Contanos qué pasó.',
  descripcionLarga: 'El aviso puede tener hasta 2000 caracteres.',
  /** Lo que no es: para lo urgente o lo de los datos, hay otros caminos. */
  noEs: 'Para pedir algo sobre tus datos, usá «Tus datos». Si no podés entrar a tu cuenta, escribí al canal de ayuda.',
  propias: {
    titulo: 'Tus avisos',
    vacio: 'Todavía no avisaste ningún problema.',
    sinLeer: 'No pudimos traer tus avisos.',
    estado: { OPEN: 'Recibido', IN_PROGRESS: 'Lo estamos viendo', RESOLVED: 'Resuelto' } as Readonly<Record<EstadoDeIncidencia, string>>,
    respuesta: 'Respuesta',
    avisado: (fecha: string): string => `Avisado el ${fecha}`,
  },
  administracion: {
    titulo: 'Incidencias',
    bajada: 'Lo que avisaron las personas y los profesionales sobre el acceso, los perfiles, los vínculos, los datos o el funcionamiento. Cada cambio de estado queda con su motivo.',
    filtroEstado: 'Estado',
    filtroCategoria: 'Categoría',
    pendientes: 'Pendientes',
    todas: 'Todas',
    todasLasCategorias: 'Todas las categorías',
    estado: { OPEN: 'Abierta', IN_PROGRESS: 'En curso', RESOLVED: 'Resuelta' } as Readonly<Record<EstadoDeIncidencia, string>>,
    vacio: 'No hay incidencias con esos filtros.',
    verDetalle: 'Ver el detalle',
    cerrarDetalle: 'Cerrar el detalle',
    reporto: 'Avisó',
    aCargo: 'A cargo',
    sinAsignar: 'Nadie la tomó todavía',
    historia: 'Historia',
    sinHistoria: 'Todavía no tuvo cambios.',
    cambiar: 'Cambiar el estado',
    estadoNuevo: 'Estado nuevo',
    motivo: 'Motivo (lo ve solo Administración)',
    respuesta: 'Respuesta para quien la avisó',
    respuestaAyuda: 'Obligatoria al resolverla. La ve en su cuenta.',
    guardar: 'Guardar el cambio',
    guardando: 'Guardando…',
    motivoRequerido: 'Escribí el motivo del cambio.',
    respuestaRequerida: 'Para resolverla, escribí la respuesta para quien la avisó.',
    mismoEstado: 'Ya está en ese estado.',
    cambio: 'Alguien la cambió mientras la mirabas. La volvimos a traer.',
    cargarMas: 'Ver más',
  },
} as const;
