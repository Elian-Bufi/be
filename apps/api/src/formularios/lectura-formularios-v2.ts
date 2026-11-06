/**
 * De filas al contrato V2 de los formularios (DL-164), y de vuelta. Lo que acá no es cosmético:
 *
 * - una versión es **V2** si su contenido declara `format: 2`; las de P0 no lo tienen. Con ese solo dato se decide qué
 *   APK la puede abrir: FRM-02 no la sirve, FRM-06 no lista sus Solicitudes y FRM-05/07/08 responden el 404 de lo
 *   inexistente (D-5). La familia FRI sirve a las dos, y las de P0 se traducen con `campoV1AV2` (sus límites internos,
 *   `numberLimits`, pasan al campo);
 * - una respuesta se **guarda en el formato de su versión**: V2 como `{ format: 2, answers: [{ fieldCode, answer,
 *   provenance }] }`; P0 en la forma V1 de siempre, para que FRM-05 la siga sirviendo a las APK instaladas. Al leer, las
 *   dos salen en V2;
 * - la propuesta del profesional (D-3) guarda solo `{ format: 2, answers: [{ fieldCode, answer }] }` mientras espera:
 *   no es una Respuesta y no lleva procedencia por campo.
 */
import {
  CAPACIDAD_FORMULARIOS_FORMATO_3,
  camposEnOrden,
  campoV1AV2,
  CodigoDeError,
  CODIGO_DE_PROBLEMA_V2,
  normalizarValor,
  resolverVistaEfectiva,
  validarRespuestasV2,
  type CampoDePlantilla,
  type CampoDePlantillaV2,
  type PropuestaDeRespuesta,
  type RelacionDeCorreccion,
  type RespuestaDeCampoV2,
  type RespuestaDeCampoV2Entrada,
  type RespuestaDeFormularioV2,
  type SeccionDePlantillaV2,
  type SolicitudAValidar,
  type Transcripcion,
  type ValorDeRespuestaV2,
  type VersionDePlantillaV2,
} from '@be/domain';
import type {
  Prisma,
  PropuestaDeRespuestaDeFormulario as FilaDePropuesta,
  RectificacionDeRespuestaDeFormulario as FilaDeRectificacion,
  RespuestaDeFormulario as FilaDeRespuesta,
  SolicitudDeFormulario as FilaDeSolicitud,
  VersionDePlantillaDeFormulario as FilaDeVersionDePlantilla,
} from '@prisma/client';
import type { ContextoDeSolicitud } from '../http/contexto';
import { ErrorDeApi } from '../http/errores';
import { solicitudApi, terminalVersion, type ContenidoDePlantilla } from './lectura-formularios';

const token = (n: number): string => `v${n}`;

// ─── La versión y su definición ─────────────────────────────────────────────────────────────────

/**
 * Lo que siembra la migración para una versión V2: el formato, los minutos estimados y las secciones del contrato V2. El
 * formato 3 (DL-165) suma lo de la ronda 2 y no trae minutos (D-3).
 */
interface ContenidoV2 {
  format: 2 | 3;
  estimatedMinutes?: number | null;
  sections: SeccionDePlantillaV2[];
}

/** El formato que declara el contenido de una versión: 2 o 3; `null` en las de P0, que no lo tienen. */
function formatoDe(contenido: unknown): 2 | 3 | null {
  const f = (contenido as { format?: unknown } | null)?.format;
  return f === 2 || f === 3 ? f : null;
}

/**
 * Una versión es V2 si su contenido declara `format: 2` o, desde DL-165, `format: 3`; las de P0 no lo tienen (DL-164
 * D-5). Con ese solo dato FRM-02 no la sirve, FRM-06 no lista sus Solicitudes y FRM-05/07/08 responden el 404.
 */
export function esVersionV2(contenido: unknown): boolean {
  return formatoDe(contenido) !== null;
}

/** DL-165 · una versión de formato 3: solo se le entrega a un cliente que declara `forms-format-3`. */
export const esFormato3 = (contenido: unknown): boolean => formatoDe(contenido) === 3;

/**
 * Si a este pedido se le retiene una versión: es de formato 3 y el cliente no declara que la lee (la APK 0.20 y las
 * anteriores). El website y la APK nueva la declaran. Como DL-122: no se infiere ni se finge.
 */
export const seRetieneElFormato = (ctx: Pick<ContextoDeSolicitud, 'capacidades'>, contenido: unknown): boolean => esFormato3(contenido) && !ctx.capacidades.has(CAPACIDAD_FORMULARIOS_FORMATO_3);

/** El 404 de lo inexistente (09:226), idéntico: el motivo real queda solo en la auditoría. */
export const formatoRetenido = (): ErrorDeApi => new ErrorDeApi(404, CodigoDeError.RESOURCE_NOT_FOUND, 'Recurso no encontrado.', undefined, CodigoDeError.CLIENT_CAPABILITY_REQUIRED);

export interface DefinicionV2 {
  readonly format: 2 | 3;
  readonly usesNewTypes: boolean;
  readonly estimatedMinutes: number | null;
  readonly sections: SeccionDePlantillaV2[];
}

/** La definición de cualquier versión en formato V2. La de P0 se traduce campo por campo, con sus límites (DL-101). */
export function definicionV2(contenido: unknown): DefinicionV2 {
  const formato = formatoDe(contenido);
  if (formato !== null) {
    const c = contenido as ContenidoV2;
    const minutos = c.estimatedMinutes;
    return { format: formato, usesNewTypes: true, estimatedMinutes: typeof minutos === 'number' && Number.isInteger(minutos) && minutos > 0 ? minutos : null, sections: c.sections };
  }
  const c = contenido as ContenidoDePlantilla;
  return {
    format: 2,
    usesNewTypes: false,
    estimatedMinutes: null,
    sections: (c.sections ?? []).map((s) => ({
      sectionCode: s.sectionCode,
      title: s.title,
      intro: null,
      fields: s.fields.map((f) => campoV1AV2(f as CampoDePlantilla, c.numberLimits?.[f.fieldCode])),
    })),
  };
}

/** Los campos de una definición, por código. */
export function camposV2PorCodigo(secciones: readonly SeccionDePlantillaV2[]): Map<string, CampoDePlantillaV2> {
  return new Map(camposEnOrden(secciones).map((c) => [c.fieldCode, c] as const));
}

/**
 * Las versiones con tipos nuevos, por id: FRM-06 no lista sus Solicitudes (D-5). El catálogo es chico y de solo agregar,
 * así que la lista se lee entera en cada consulta; un filtro JSON de Prisma sobre `format` dejaría afuera, por el NULL,
 * a las versiones de P0 que no tienen la clave.
 */
export async function versionesV2(tx: Prisma.TransactionClient): Promise<string[]> {
  const filas = await tx.$queryRaw<{ id: string }[]>`SELECT "id"::text AS "id" FROM "version_de_plantilla_de_formulario" WHERE "contenido" ->> 'format' IN ('2', '3')`;
  return filas.map((f) => f.id);
}

/** DL-165 · las versiones de formato 3, por id: FRI-02 no lista sus Solicitudes a un cliente que no las lee. */
export async function versionesDeFormato3(tx: Prisma.TransactionClient): Promise<string[]> {
  const filas = await tx.$queryRaw<{ id: string }[]>`SELECT "id"::text AS "id" FROM "version_de_plantilla_de_formulario" WHERE "contenido" ->> 'format' = '3'`;
  return filas.map((f) => f.id);
}

/**
 * FRM-02, 05, 07 y 08 frente a una versión V2: el mismo 404 que lo inexistente, sin revelar que existe algo que esa APK
 * no puede abrir (D-5; DL-152). El motivo real queda solo en la auditoría.
 */
export const noServidaEnV1 = (): ErrorDeApi => new ErrorDeApi(404, CodigoDeError.RESOURCE_NOT_FOUND, 'Recurso no encontrado.', undefined, 'FORMATO_V2_SOLO_FRI');

type VersionConPlantilla = FilaDeVersionDePlantilla & { plantilla: { id: string; clave: string }; sucesora?: { id: string } | null };

/** API-FRI-01: la versión exacta, en formato V2; `status` se deriva de si tiene sucesora (REG-06-209). */
export function versionDePlantillaV2Api(v: VersionConPlantilla): VersionDePlantillaV2 {
  const d = definicionV2(v.contenido);
  return {
    templateId: v.plantilla.id,
    templateVersionId: v.id,
    key: v.plantilla.clave,
    name: v.nombre,
    purpose: v.proposito,
    domain: v.dominio,
    version: v.version,
    status: v.sucesora ? 'HISTORICAL_NOT_SELECTABLE' : 'SELECTABLE',
    format: d.format,
    usesNewTypes: d.usesNewTypes,
    estimatedMinutes: d.estimatedMinutes,
    sections: d.sections,
    supersededByVersionId: v.sucesora?.id ?? null,
    effectiveSince: v.momentoDeRegistro.toISOString(),
    provenanceNote: (v.procedencia as { rotulo?: string } | null)?.rotulo ?? 'Valores sintéticos de demostración.',
  };
}

// ─── La Solicitud en V2 ─────────────────────────────────────────────────────────────────────────

type SolicitudConVersion = FilaDeSolicitud & { templateVersion: { nombre: string; plantillaId: string; contenido: unknown } };

/** Lo que FRM-06 lista de una Solicitud, más el formato de su versión y los minutos (sin `respondable` ni la propuesta). */
export function solicitudV2Api(s: SolicitudConVersion, nombreProfesional: string, nombreAsesorado: string, respondida: boolean): Record<string, unknown> {
  const d = definicionV2(s.templateVersion.contenido);
  return {
    ...(solicitudApi(s, nombreProfesional, nombreAsesorado, respondida) as Record<string, unknown>),
    usesNewTypes: d.usesNewTypes,
    estimatedMinutes: d.estimatedMinutes,
  };
}

export const solicitudAValidar = (s: Pick<FilaDeSolicitud, 'camposSolicitados' | 'camposRequeridos'>): SolicitudAValidar => ({
  requestedFieldCodes: s.camposSolicitados as string[],
  requiredFieldCodes: s.camposRequeridos as string[],
});

// ─── Respuestas: de lo guardado al contrato, y del contrato a lo que se guarda ──────────────────

/** Una respuesta guardada en V1: la forma de FRM-07 y de las versiones de P0. */
interface RespuestaV1Almacenada {
  fieldCode: string;
  value: string | number | boolean;
  unit?: string | null;
}
/** Una respuesta guardada en V2 (y un renglón de una propuesta): el valor dice su tipo. */
interface RespuestaV2Almacenada {
  fieldCode: string;
  answer: ValorDeRespuestaV2;
}

/**
 * Un número guardado en V1 puede venir sin `unit`: las APK instaladas responden por FRM-07 con `{ fieldCode, value }` y la
 * unidad era la de la plantilla, que las pantallas de P0 mostraban desde el campo. Al traducir se completa desde el campo,
 * como hace `valorCitado` (entrenamiento/citas-de-respuestas.ts): el dato no cambia, solo recupera su unidad.
 */
function valorV1AV2(a: RespuestaV1Almacenada, campo: CampoDePlantillaV2 | undefined): ValorDeRespuestaV2 {
  if (typeof a.value === 'number') return { type: 'NUMBER', number: a.value, unit: a.unit ?? (campo?.dataType === 'NUMBER' ? campo.unit : null) ?? null };
  if (typeof a.value === 'boolean') return { type: 'BOOLEAN', yes: a.value };
  return { type: 'TEXT', text: a.value };
}

/**
 * Las respuestas de un contenido guardado, en formato V2. Las de V1 se traducen por el tipo del valor: la plantilla ya
 * exigió al guardarlas que coincida con el del campo (TEXT, NUMBER con su unidad, BOOLEAN). `campos` son los de la versión
 * de la Respuesta (`camposV2PorCodigo`): de ahí sale la unidad de un número que se guardó sin ella.
 */
export function respuestasV2De(contenido: unknown, campos: ReadonlyMap<string, CampoDePlantillaV2>): RespuestaDeCampoV2[] {
  const c = contenido as { answers?: (RespuestaV1Almacenada | RespuestaV2Almacenada)[] } | null;
  return (c?.answers ?? []).map((a) => ({ fieldCode: a.fieldCode, answer: 'answer' in a ? a.answer : valorV1AV2(a, campos.get(a.fieldCode)), provenance: 'SELF_REPORTED' as const }));
}

/** Las respuestas que una propuesta guarda mientras espera (vacío si ya se resolvió: se borraron, D-6). */
export function respuestasDePropuesta(contenido: unknown): RespuestaDeCampoV2Entrada[] {
  const c = contenido as { answers?: RespuestaV2Almacenada[] } | null;
  return (c?.answers ?? []).map((a) => ({ fieldCode: a.fieldCode, answer: a.answer }));
}

function valorV2AV1(v: ValorDeRespuestaV2): string | number | boolean {
  switch (v.type) {
    case 'TEXT':
      return v.text;
    case 'NUMBER':
      return v.number;
    case 'BOOLEAN':
      return v.yes;
    default:
      // La validación contra una versión de P0 ya rechazó cualquier otro tipo (TYPE_MISMATCH).
      throw new Error(`BE: una versión de P0 no admite una respuesta ${v.type} (DL-164 D-5).`);
  }
}

/**
 * El contenido que se guarda para una Respuesta o una rectificación, **en el formato de la versión**: V2 con cada valor
 * y su procedencia; P0 en la forma V1 de siempre (`value`, `unit`, `profileSourceRef`), así FRM-05 la sigue sirviendo a
 * las APK instaladas. Los valores van en su forma canónica (`normalizarValor`): no cambia lo dicho, solo su forma.
 */
export function contenidoDeRespuestasV2(campos: ReadonlyMap<string, CampoDePlantillaV2>, versionV2: boolean, respuestas: readonly RespuestaDeCampoV2Entrada[]): Prisma.InputJsonValue {
  const normalizadas = respuestas.map((r) => ({ fieldCode: r.fieldCode, answer: normalizarValor(campos.get(r.fieldCode), r.answer) }));
  if (versionV2) return { format: 2, answers: normalizadas.map((r) => ({ ...r, provenance: 'SELF_REPORTED' })) } as unknown as Prisma.InputJsonValue;
  return {
    answers: normalizadas.map((r) => ({
      fieldCode: r.fieldCode,
      value: valorV2AV1(r.answer),
      unit: r.answer.type === 'NUMBER' ? r.answer.unit : null,
      profileSourceRef: null,
      provenance: 'SELF_REPORTED',
    })),
  } as unknown as Prisma.InputJsonValue;
}

/** Lo que guarda la propuesta mientras espera: los valores, en su forma canónica, sin procedencia (no es una Respuesta). */
export function contenidoDePropuesta(campos: ReadonlyMap<string, CampoDePlantillaV2>, respuestas: readonly RespuestaDeCampoV2Entrada[]): Prisma.InputJsonValue {
  return { format: 2, answers: respuestas.map((r) => ({ fieldCode: r.fieldCode, answer: normalizarValor(campos.get(r.fieldCode), r.answer) })) } as unknown as Prisma.InputJsonValue;
}

/**
 * Valida como el dominio (`validarRespuestasV2`) y, si hay problemas, lanza el 422 con un issue por problema, todos a
 * la vez (DL-104; nunca repite el valor enviado). Con `exigirObligatorios: false` (la propuesta del profesional,
 * FRI-06) un obligatorio sin responder no es un problema: lo completa la persona al confirmar.
 */
export function exigirRespuestasValidas(
  secciones: readonly SeccionDePlantillaV2[],
  solicitud: SolicitudAValidar,
  respuestas: readonly RespuestaDeCampoV2Entrada[],
  opciones: { readonly exigirObligatorios: boolean },
): void {
  const problemas = validarRespuestasV2(secciones, solicitud, respuestas).filter((p) => opciones.exigirObligatorios || p.code !== CODIGO_DE_PROBLEMA_V2.REQUIRED);
  if (problemas.length > 0) {
    throw new ErrorDeApi(422, CodigoDeError.FORM_RESPONSE_INVALID, 'Hay respuestas que no tienen la forma que pide el formulario.', { issues: problemas });
  }
}

// ─── La Respuesta, la transcripción y la propuesta en el contrato ───────────────────────────────

/** Lo que la Respuesta guarda de la propuesta que confirmó (D-4): la columna `transcripcion`. */
export interface TranscripcionAlmacenada {
  professionalId: string;
  proposalId: string;
  loadedAt: string;
  confirmedAt: string;
  correctedFieldCodes: string[];
}

export function transcripcionApi(t: TranscripcionAlmacenada, nombreProfesional: string): Transcripcion {
  return { professional: { identityId: t.professionalId, displayName: nombreProfesional }, loadedAt: t.loadedAt, confirmedAt: t.confirmedAt, correctedFieldCodes: t.correctedFieldCodes };
}

type RespuestaConRectificaciones = FilaDeRespuesta & { rectificaciones: FilaDeRectificacion[] };

/**
 * La Respuesta en V2, con la misma vista efectiva de B-06 que FRM-05 y la transcripción si nació de una propuesta.
 * `campos` son los de su versión: completan la unidad de un número que una APK instalada guardó sin ella.
 */
export function respuestaV2Api(r: RespuestaConRectificaciones, transcription: Transcripcion | null, campos: ReadonlyMap<string, CampoDePlantillaV2>): RespuestaDeFormularioV2 {
  const relaciones: RelacionDeCorreccion[] = r.rectificaciones.map((c) => ({ id: c.id, originalId: r.id, correccionPreviaId: c.correccionPreviaId }));
  const vista = resolverVistaEfectiva(r.id, relaciones);
  const effectiveView =
    vista.tipo === 'ORIGINAL' ? { kind: 'ORIGINAL' as const } : vista.tipo === 'CORREGIDA' ? { kind: 'RECTIFIED' as const, rectificationId: vista.id } : { kind: 'NOT_RESOLVABLE' as const };
  return {
    formResponseId: r.id,
    formRequestId: r.solicitudId,
    adviseeId: r.asesoradoId,
    templateVersionId: r.templateVersionId,
    original: { answers: respuestasV2De(r.contenido, campos) },
    rectifications: r.rectificaciones.map((c) => ({
      rectificationId: c.id,
      previousRectificationId: c.correccionPreviaId,
      reason: c.motivo,
      answers: respuestasV2De(c.contenido, campos),
      version: token(c.version),
      recordedAt: c.momentoDeRegistro.toISOString(),
    })),
    effectiveView,
    transcription,
    version: token(terminalVersion(r)),
    submittedAt: r.momentoDeRegistro.toISOString(),
  };
}

/** La propuesta completa: solo para quien la cargó y para la persona (D-3). */
export function propuestaApi(p: FilaDePropuesta, nombreProfesional: string): PropuestaDeRespuesta {
  return {
    proposalId: p.id,
    formRequestId: p.solicitudId,
    professional: { identityId: p.profesionalId, displayName: nombreProfesional },
    answers: respuestasDePropuesta(p.contenido),
    loadedAt: p.cargadaEn.toISOString(),
    version: token(p.version),
  };
}

/** `ResumenDePropuestaSchema` del contrato: quién, cuándo y su versión; nunca sus respuestas. */
export interface ResumenDePropuesta {
  readonly proposalId: string;
  readonly professional: { readonly identityId: string; readonly displayName: string };
  readonly loadedAt: string;
  readonly version: string;
}
/** `DesenlaceDePropuestaSchema` del contrato: cómo y cuándo terminó una propuesta que no se confirmó. */
export interface DesenlaceDePropuesta {
  readonly outcome: 'REJECTED' | 'WITHDRAWN';
  readonly loadedAt: string;
  readonly resolvedAt: string;
}

/** Lo que la bandeja dice de la propuesta que espera: quién, cuándo y su versión; nunca sus respuestas. */
export function resumenDePropuestaApi(p: FilaDePropuesta, nombreProfesional: string): ResumenDePropuesta {
  return { proposalId: p.id, professional: { identityId: p.profesionalId, displayName: nombreProfesional }, loadedAt: p.cargadaEn.toISOString(), version: token(p.version) };
}

/** Lo que queda de una propuesta que no se confirmó (D-6): `null` si está pendiente o se confirmó. */
export function desenlaceApi(p: FilaDePropuesta): DesenlaceDePropuesta | null {
  if (p.estado !== 'RECHAZADA' && p.estado !== 'RETIRADA') return null;
  return { outcome: p.estado === 'RECHAZADA' ? 'REJECTED' : 'WITHDRAWN', loadedAt: p.cargadaEn.toISOString(), resolvedAt: (p.resueltaEn ?? p.cargadaEn).toISOString() };
}
